import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
  shallowReactiveHandlers,
} from "./baseHandler";

import { isObject } from "@mini/shared";

// WeakMap 只能用对象作为 key，并且会自动进行垃圾回收，避免造成内存泄漏
export const reactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();

export function reactive(target) {
  return createReactiveObject(target, false, mutableHandlers);
}

export function shallowReactive(target) {
  return createReactiveObject(target, false, shallowReactiveHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers);
}

export function shallowReadonly(target) {
  return createReactiveObject(target, true, shallowReadonlyHandlers);
}

/**
 * 对目标对象使用 Proxy 进行代理（存放到相应的 WeakMap 中）
 * @param target
 * @param isReadonly
 * @param baseHandlers
 * @returns
 */
function createReactiveObject(target, isReadonly, baseHandlers) {
  // reactive 必须接受一个 Object 作为参数以此使用 Proxy 对其进行代理（Proxy 接收的参数必须为Obj）
  if (!isObject(target)) {
    return target;
  }

  // 被代理过的对象不允许再次被代理
  const proxyMap = isReadonly ? readonlyMap : reactiveMap;

  if (proxyMap.has(target)) {
    return proxyMap.get(target);
  }

  const proxy = new Proxy(target, baseHandlers);
  proxyMap.set(target, proxy);

  return proxy;
}
