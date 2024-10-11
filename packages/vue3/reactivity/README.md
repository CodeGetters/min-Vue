# reactivity

本模块主要实现了创建 JS 响应式对象，同时对响应式对象进行追踪，如果响应式对象发生了变化，那么会触发相应的更新。

```sh
pnpm dev reactivity -p vue3

pnpm dev reactivity -p vue3 -f esm

pnpm dev reactivity -p vue3 -f cjs
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

- [x] reactive
- [x] readonly
- [x] toRaw
- [x] isProxy
- [x] isReactive
- [x] isReadOnly
- [x] ref
- [x] isRef
- [x] effect
- [x] trigger
- [x] track
- [x] computed
- [x] ReactiveEffect
- [ ] watch
