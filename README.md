# mini

- [ ] vue3
  - [x] base
  - [x] reactive
  - [ ] runtime-dom
  - [ ] runtime-core
- [ ] react

## 运行命令后将自动进入 debug mode

来源于：.vscode/launch.json (同 vue-core)

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "type": "node", // 调试器类型
      "request": "launch", // 调试器启动方式(launch：启动一个新的调试会话)
      "name": "Auto Debug --same as vue-core", // 调试器名称（在调试器可见）
      "autoAttachChildProcesses": true, // 自动附加到子进程(调试由主进程生成的子进程)
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"], // 指定调试时需要跳过的文件（node内部文件、node_modules）
      "args": ["run", "${relativeFile}"], // 传递给程序的命令行参数
      "smartStep": true, // 启动智能模式---跳过没有调试信息的代码
      "console": "integratedTerminal" // 指定调试器的控制台---终端
    }
  ]
}
```

setting.json

```json
{
  // Use the project's typescript version
  "typescript.tsdk": "node_modules/typescript/lib", // 指定 TS SDK 路径

  "cSpell.enabledLanguageIds": ["markdown", "plaintext", "text", "yml"], // 启动 cSpell 检查

  // Use prettier to format typescript, javascript and JSON files
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

```bash
# example for dev or build

pnpm dev

pnpm dev reactivity -p vue3

pnpm dev reactivity -p vue3 -f esm

pnpm build

pnpm build vue/base vue3/reactivity

pnpm build vue/base vue3/reactivity -f esm-bundler

```
