/**
 * ====================================================================
 *
 * @file：Vue3.5之前 effect 的实现：
 *
 * 这里主要是 effect 的实现，effect 实现的过程中涉及到几点内容：
 * 1、effect options.lazy 可以控制是否立即执行其回调，所以需要判断一下
 * 2、effect 回调如果涉及到响应式数据的操作，那么必定会触发 get/set 操作
 *    a.触发 set/get 将会会去执行对应的 handlers
 *    b.触发对应的 handlers 且是非只读响应式数据，那么将进行收集依赖 track(target,type,key)
 * 3、如果 effect 中会嵌套 effect 那么需要将当前的 effect 保存起来，并且在嵌套的 effect 执行完毕后再恢复
 *    a.这里使用 effectStack 来保存当前的 effect
 *    b.在嵌套的 effect 执行完毕后，需要将 effectStack 中的最后一个 effect 弹出并将最新的 effect 赋值给 activeEffect
 * ====================================================================
 */
import { extend } from "@mini/shared";

export let activeEffect;
let uid = 0;
const effectStack = [];

export class ReactiveEffect<T = any> {
  constructor(public fn: () => T) {
    // if(activeEffectScope)
  }
}

export function effect<T = any>(fn: () => T, options?) {
  const e = createReactiveEffect(fn, options);
  if (!options || (options && !options.lazy)) {
    e();
  }
  return e;
  // const e = new ReactiveEffect(fn);
  // if (options) {
  //   extend(e, options);
  // }
}

function createReactiveEffect(fn, options) {
  const e = function reactiveEffectFn() {
    if (!effectStack.includes(e)) {
      try {
        activeEffect = e;
        effectStack.push(activeEffect);
        fn();
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };
  e.id = uid++;
  e._isEffect = true;
  e.raw = fn;
  e.options = options;
  return e;
}
