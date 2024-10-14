import esbuild from "esbuild";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { polyfillNode } from "esbuild-plugin-polyfill-node";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const {
  values: { project: rawProject, format: rawFormat },
  positionals,
} = parseArgs({
  allowPositionals: true, // 允许解析位置参数
  options: {
    project: {
      type: "string",
      short: "p",
      default: "vue3",
    },
    format: {
      type: "string",
      short: "f",
      default: "global",
    },
  },
});

/**
 * @param {string} project 项目名称
 * @param {string} format 打包格式
 * @param {string} target 打包目标位置
 */
const project = rawProject || "vue3";
const target = positionals.length ? positionals : ["reactivity"];
const format = rawFormat || "global";
console.log("=====运行命令参数======", rawProject, rawFormat, target);

const pkgBase = `../packages/${project}/${target}`;
// console.log("====pkgBase====", pkgBase);
const pkg = require(resolve(__dirname, `${pkgBase}/package.json`));
const options = pkg.buildOptions;
const name = options.name;

// 最终产物配置
const outputConfig = {
  esm: {
    file: resolve(__dirname, `${pkgBase}/dist/${name}.esm-bundler.js`),
    format: "es",
  },
  cjs: {
    file: resolve(__dirname, `${pkgBase}/dist/${name}.cjs.js`),
    format: "cjs",
  },
  global: {
    file: resolve(__dirname, `${pkgBase}/dist/${name}.global.js`),
    format: "iife",
  },
};

const outputFormat = outputConfig[format].format;
const outputFile = outputConfig[format].file;

/** @type {Array<import('esbuild').Plugin>} */
const plugins = [
  {
    name: "log-rebuild",
    setup(build) {
      build.onEnd(() => {
        console.log(`built: ${relative(process.cwd(), outputFile)}`);
      });
    },
  },
];

if (outputFormat !== "cjs" && pkg.buildOptions?.enableNonBrowserBranches) {
  plugins.push(polyfillNode());
}

// dev mode 使用 esbuild 提速
esbuild
  .context({
    entryPoints: [resolve(__dirname, `${pkgBase}/src/index.ts`)],
    // drop: ["debugger", "console"], // 在构建之前编辑源代码以删除某些构造
    outfile: outputFile,
    bundle: true, // 是否打包到
    minify: false, // 是否进行代码压缩
    sourcemap: true,
    format: outputFormat,
    globalName: options.name,
    platform: outputFormat === "cjs" ? "node" : "browser",
    plugins,
  })
  .then((ctx) => ctx.watch());
