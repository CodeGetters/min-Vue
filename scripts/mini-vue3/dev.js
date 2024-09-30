import minimist from "minimist";
import esbuild from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve } from "node:path";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// 获取执行命令的参数---将【node】和【命令文件路径】去掉
const argv = minimist(process.argv.slice(2)); // 路径解析为【project/package】
console.log("=====执行命令参数======", argv);

const project = argv._[0] || "mini-vue3";
const target = argv._[1] || "compiler-core";
const format = argv["f"] || "global";

const pkgBase = `../../packages/${project}/${target}`;
console.log("====pkgBase====", pkgBase);
const pkg = require(resolve(__dirname, `${pkgBase}/package.json`));
const options = pkg.buildOptions;

const outputConfig = {
  esm: {
    file: resolve(__dirname, `${pkgBase}/dist/${target}.esm-bundler.js`),
    format: "esm",
  },
  cjs: {
    file: resolve(__dirname, `${pkgBase}/dist/${target}.cjs.js`),
    format: "cjs",
  },
  global: {
    file: resolve(__dirname, `${pkgBase}/dist/${target}.global.js`),
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
