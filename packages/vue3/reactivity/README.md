# reactivity

```sh
pnpm dev vue3 reactivity
pnpm dev vue3 reactivity -f esm

pnpm dev vue3 reactivity -f cjs
```

```txt
├── arrayInstrumentations.ts
├── baseHandlers.ts
├── collectionHandlers.ts
├── constant.ts
├── dep.ts
├── index.ts
├── makeMap.ts
├── reactive.ts
└── ref.ts
```

## 核心功能

- 代理
- reactive 响应式
- ref 引用
- effect 副作用
- 依赖收集
- 触发更新
- computed 计算属性
- 集合类型的处理
