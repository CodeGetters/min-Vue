import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const packageDir = path.resolve(__dirname, process.env.TARGET);

const resolve = (/** @type {string} */ p) => path.resolve(packageDir, p);
console.log("============packageDir========", packageDir, resolve);

// const outputCOnfigs = {
//   "esm-bundler": {
//     file: resolve(),
//   },
//   "esm-browser": {},
//   cjs: {},
//   global: {},
//   // runtime-only builds, for main "vue" package only
//   "esm-budler-runtime": {},
//   "esm-browser-runtime": {},
//   "global-runtime": {},
// };
