import alias from "@rollup/plugin-alias";
import json from "@rollup/plugin-json";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "rollup-plugin-esbuild";
import pico from "picocolors";
import resolvePlugin from "@rollup/plugin-node-resolve";

const require = createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const packageDir = path.resolve(__dirname, "packages", process.env.TARGET); // 包地址
const resolve = (/** @type {string} */ p) => path.resolve(packageDir, p); // 解析地址
const pkg = require(resolve(`package.json`)); // 包信息
const packageOptions = pkg.buildOptions || {}; // 包配置
const name = packageOptions.filename || path.basename(packageDir); // 包名
// console.log("============packageDir========", packageDir, pkg);

/** @type {Record<PackageFormat, OutputOptions>} */
const outputConfigs = {
  "esm-bundler": {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: "es",
  },
  "esm-browser": {
    file: resolve(`dist/${name}.esm-browser.js`),
    format: "es",
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: "cjs",
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: "iife",
  },
  /**
   * ============================
   * 对生产环境下的内容不做额外处理
   * =============================
   */
  // runtime-only builds, for main "vue" package only
  //   "esm-budler-runtime": {},
  //   "esm-browser-runtime": {},
  //   "global-runtime": {},
};

/** @type {ReadonlyArray<PackageFormat>} */
const defaultFormats = ["esm-bundler", "cjs"];
const inlineFormats = /** @type {any} */ (
  process.env.FORMATS && process.env.FORMATS.split(",") // 解析命令行中的输出格式
);
const packageFormats =
  inlineFormats || packageOptions.formats || defaultFormats; // 最终输出格式
const packageConfigs = process.env.PROD_ONLY
  ? []
  : packageFormats.map((format) => createConfig(format, outputConfigs[format])); // 输出环境配置

// 生产环境配置
if (process.env.NODE_ENV === "production") {
  packageFormats.forEach((format) => {
    if (packageOptions.prod === false) {
      return;
    }
    /**
     * ============================
     * 对生产环境下的内容不做额外处理
     * =============================
     */
    // if (format === "cjs") {
    //   packageConfigs.push(createProductionConfig(format));
    // }
    // if (/^(global|esm-browser)(-runtime)?/.test(format)) {
    //   packageConfigs.push(createMinifiedConfig(format));
    // }
  });
}
// console.log("============packageConfigs========", packageConfigs);

export default packageConfigs;

/**
 *
 * @param {PackageFormat} format
 * @param {OutputOptions} output
 * @param {ReadonlyArray<import('rollup').Plugin>} plugins
 * @returns {import('rollup').RollupOptions}
 */
function createConfig(format, output, plugins = []) {
  if (!output) {
    console.log(pico.yellow(`invalid format: "${format}"`));
    process.exit(1);
  }

  const isBrowserESMBuild = /esm-browser/.test(format);
  const isCJSBuild = format === "cjs";
  const isGlobalBuild = /global/.test(format);

  if (isCJSBuild) {
    output.esModule = true;
  }
  output.externalLiveBindings = false; // 取消外部模块的实时绑定
  // https://github.com/rollup/rollup/pull/5380
  output.reexportProtoFromExternal = false; // 取消重新导出外部模块的属性

  if (isGlobalBuild) {
    output.name = packageOptions.name;
  }

  let entryFile = /runtime$/.test(format) ? `src/runtime.ts` : `src/index.ts`;

  /**
   * 确定外部依赖以便可以更好的 treeShaking
   */
  function resolveExternal() {
    const treeShakenDeps = [
      "source-map-js",
      "@babel/parser",
      "estree-walker",
      "entities/lib/decode.js",
    ];
    if (isGlobalBuild || isBrowserESMBuild) {
      // 浏览器 / 全局构建
      if (!packageOptions.enableNonBrowserBranches) {
        return treeShakenDeps;
      }
    } else {
      return [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...["path", "url", "stream"],
        ...treeShakenDeps,
      ];
    }
  }

  output.sourcemap = true;

  //   console.log("===========format========");
  return {
    input: resolve(entryFile),
    external: resolveExternal(),
    plugins: [
      json({ namedExports: false }),
      alias({
        entries: path.resolve(
          fileURLToPath(import.meta.url),
          `../../packages/${process.env.TARGET}/src/index.ts`
        ),
      }),
      esbuild({
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
        sourceMap: output.sourcemap,
        minify: false,
        target: "es2019",
      }),
      ...plugins,
      resolvePlugin(), // 解析第三方插件
    ],
    output,
    onwarn: (msg, warn) => {
      if (msg.code !== "CIRCULAR_DEPENDENCY") {
        warn(msg);
      }
    },
    treeshake: {
      moduleSideEffects: false,
    },
  };
}

// function createProductionConfig() {}

// function createMinifiedConfig() {}
