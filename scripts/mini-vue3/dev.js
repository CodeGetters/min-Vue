// 开发模式使用 esbuild 提速，生成模式采用 rollup

const minimist = require("minimist");
const { resolve } = require("path");
const esbuild = require("esbuild");

// 获取执行命令的参数---将【node】和【命令文件路径】去掉
const argv = minimist(process.argv.slice(2)); // 路径解析为【project/package】
console.log("=====执行命令参数======", argv);

const project = argv._[0] || "mini-vue3";
const target = argv._[1] || "compiler-core";
const format = argv["f"] || "global";

const pkg = require(resolve(
  __dirname,
  `../../packages/${project}/${target}/package.json`
));
console.log("====pkg====", `packages/${project}/${target}`);
const options = pkg.buildOptions;

const outputConfig = {
  esm: {
    file: resolve(
      __dirname,
      `../../packages/${project}/${target}/dist/${target}.esm-bundler.js`
    ),
    format: "esm",
  },
  cjs: {
    file: resolve(
      __dirname,
      `../../packages/${project}/${target}/dist/${target}.cjs.js`
    ),
    format: "cjs",
  },
  global: {
    file: resolve(
      __dirname,
      `../../packages/${project}/${target}/dist/${target}.global.js`
    ),
    format: "iife",
  },
};
const outputFormat = outputConfig[format].format;
const outputFile = outputConfig[format].file;
console.log(`====当前打包模块${project}/${target}====`);

async function run() {
  const ctx = await esbuild.context({
    entryPoints: [
      resolve(__dirname, `../../packages/${project}/${target}/src/index.ts`),
    ],
    drop: ["debugger", "console"], // 在构建之前编辑源代码以删除某些构造
    outfile: outputFile,
    bundle: true, // 是否打包到
    minify: false, // 是否进行代码压缩
    sourcemap: true,
    format: outputFormat,
    globalName: options.name,
    platform: outputFormat === "cjs" ? "node" : "browser",
    plugins: [
      {
        name: "rebuild-notify",
        setup(build) {
          build.onEnd((res) => {
            console.log(`watching....`);
          });
        },
      },
    ],
  });

  await ctx.watch();
}

run();
