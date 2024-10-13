# Reactivity

此包旨在于提供如下几个 API：

- ref
- reactive
- readonly
- shallowRef
- shallowReactive
- shallowReadonly

其中 shallow 的意思是没有深层级的转换，只有根级别的属性是响应式的。如：

```ts
import { shallowReactive, reactive } from "vue";

const state = shallowReactive({
  foo: 1,
  nested: {
    bar: 2,
  },
});
const state2 = reactive({
  foo: 1,
  nested: {
    bar: 2,
  },
});

// 更改状态自身的属性是响应式的
state.foo++;
state2.foo++;

// ...但下层嵌套对象不会被转为响应式
console.log(isReactive(state.nested)); // false
console.log(isReactive(state2.nested)); // true
```

readonly ：接受一个对象 (不论是响应式还是普通的) 或是一个 ref，返回一个原值的只读代理

```ts
import { readonly, reactive, watchEffect } from "vue";

const original = reactive({ count: 0 });
const copy = readonly(original);

watchEffect(() => {
  // 用来做响应性追踪
  console.log(copy.count);
});

// 更改源属性会触发其依赖的侦听器
original.count++;

// 更改该只读副本将会失败，并会得到一个警告
copy.count++; // warning!
```
