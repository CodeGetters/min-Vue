import fs, { existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import path from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { cpus } from "node:os";
import { spawn } from "node:child_process";

const allTargets = fs
  .readdirSync("packages")
  .filter((p) => fs.statSync(`packages/${p}`).isDirectory())
  .flatMap((parent) =>
    fs
      .readdirSync(`packages/${parent}`)
      .filter(
        (child) =>
          fs.statSync(`packages/${parent}/${child}`).isDirectory() &&
          fs.existsSync(`packages/${parent}/${child}/package.json`)
      )
      .map((child) => `${parent}/${child}`)
  );

const { values, positionals: targets } = parseArgs({
  allowPositionals: true,
  options: {
    formats: {
      type: "string",
      short: "f",
    },
    prodOnly: {
      type: "boolean",
      short: "p",
    },
    devOnly: {
      type: "boolean",
      short: "d",
    },
  },
});

const { formats, prodOnly, devOnly } = values;

run();

async function run() {
  const resolveTargets = targets.length ? [...targets] : allTargets;
  await buildAll(resolveTargets);
}

async function buildAll(targets) {
  await runParallel(cpus().length, targets, build);
}

/**
 * 并发执行多个任务同时限制并发数，返回一个包含所有任务结果的 Promise
 * @param {number} maxConcurrency
 * @param {Array<T>} targets
 * @param {(item:T) => Promise<void>} iteratorFn
 * @returns {Promise<void[]>}
 */
async function runParallel(maxConcurrency, targets, iteratorFn) {
  /**@type {Promise<void>[]} */
  const ret = []; // 返回值 Promise 数组
  /**@type {Promise<void>[]} */
  const executing = []; // 正在执行的 Promise 数组
  for (const item of targets) {
    // 将 iteratorFn 的执行结果包装成 Promise
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);
    if (maxConcurrency <= targets.length) {
      // 创建一个新的 Promise，用于在原始 Promise 完成后从 executing 数组中移除自身
      const e = p.then(() => {
        // 先查找 e 在数组中的索引，然后使用 splice 从数组中删除该元素
        executing.splice(executing.indexOf(e), 1);
      });
      executing.push(e); // 将新的 Promise 加入到 executing 数组中
      // 一旦 executing 数量超过并发数，则等待其中一个 Promise 完成
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

/**
 * Build the target.
 * @param {string} target
 * @returns {Promise<void>}
 */
async function build(target) {
  const pkgDir = path.resolve(`packages/${target}`);
  const pkg = JSON.parse(readFileSync(`${pkgDir}/package.json`, "utf-8"));

  // 递归删除 dist
  if (existsSync(`${pkgDir}/dist`)) {
    fs.rmSync(`${pkgDir}/dist`, { recursive: true });
  }

  const env =
    (pkg.buildOption && pkg.buildOptions.env) ||
    (devOnly ? "development" : "production");

  await exec(
    "rollup",
    [
      "-c",
      "--environment",
      [
        `NODE_ENV:${env}`,
        `TARGET:${target}`,
        formats ? `FORMATS:${formats}` : ``,
        prodOnly ? `PROD_ONLY:true` : ``,
      ]
        .filter(Boolean)
        .join(","),
    ],
    { stdio: "inherit" }
  );
}

/**
 * 执行命令行命令并返回 Promise
 * @param {string} command
 * @param {ReadonlyArray<string>} args
 * @param {object} [optinos]
 * @returns
 */
function exec(command, args, optinos) {
  return new Promise((resolve, reject) => {
    // 创建子进程执行命令
    const _process = spawn(command, args, {
      stdio: [
        "ignore", // stdin
        "pipe", // stdout
        "pipe", // stderr
      ],
      ...optinos,
      shell: process.platform === "win32",
    });

    /**
     * @type {Buffer[]} 标准输出
     */
    const stderrChunks = [];
    /**
     * @type {Buffer[]} 标准输出
     */
    const stdoutChunks = [];

    // 监听子进程的标准错误输出
    _process.stderr?.on("data", (chunk) => {
      stderrChunks.push(chunk);
    });

    // 监听子进程的标准输出
    _process.stdout?.on("data", (chunk) => {
      stdoutChunks.push(chunk);
    });

    // 监听子进程的错误事件
    _process.on("error", (error) => {
      reject(error);
    });

    // 监听子进程的退出事件
    _process.on("exit", (code) => {
      const ok = code === 0; // 判断退出码是否为0（表示成功）
      const stderr = Buffer.concat(stderrChunks).toString().trim(); // 合并并转换标准错误输出
      const stdout = Buffer.concat(stdoutChunks).toString().trim(); // 合并并转换标准输出

      if (ok) {
        // 如果执行成功，解析Promise并返回结果
        resolve({ ok, code, stderr, stdout });
      } else {
        // 如果执行失败，拒绝Promise并返回错误信息
        reject(
          new Error(
            `Failed to execute command: ${command} ${args.join(" ")}: ${stderr}`
          )
        );
      }
    });
  });
}
