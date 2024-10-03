import { ReactiveFlags } from "./constant";
import { isObject } from "@mini/shared";
import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

export interface Target {
  [ReactiveFlags.RAW]?: any;
  [ReactiveFlags.SKIP]?: boolean;
  [ReactiveFlags.IS_REACTIVE]?: boolean;
  [ReactiveFlags.IS_READONLY]?: boolean;
  [ReactiveFlags.IS_SHALLOW]?: boolean;
}

// WeakMap 只能用对象作为 key，并且会自动进行垃圾回收，避免造成内存泄漏
export const reactiveMap: WeakMap<Target, any> = new WeakMap<Target, any>();
export const readonlyMap: WeakMap<Target, any> = new WeakMap<Target, any>();

export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers);
}

export function readonly<T extends object>(target: T) {
  return createReactiveObject(target, readonlyHandlers);
}

/**
 * 创建响应式对象
 * ps:
 * Map、Set、WeakMap、WeakSet 使用 collectionHandlers
 * Object、Array 使用 baseHandlers
 * @param target 需要代理的对象
 * @param baseHandlers 普通对象的拦截处理
 */
export function createReactiveObject(
  target: Target,
  baseHandlers: ProxyHandler<any>
) {
  if (!isObject(target)) {
    // 非对象类型直接返回
    return target;
  }

  return new Proxy(target, baseHandlers);
}

/**
 * 根据一个 Vue 创建的代理返回其原始对象。
 * @see {@link https://cn.vuejs.org/api/reactivity-advanced.html#toraw}
 * @param observed
 *
 * @example
 * ```js
 * const obj = {}
 * const reactiveObj = reactive(obj)
 * console.log(toRaw(reactiveObj) === obj) // true
 * ````
 */
export function toRaw<T>(observed: T): T {
  const raw = observed && (observed as Target)[ReactiveFlags.RAW];
  return raw ? toRaw(raw) : observed;
}

export const toReactive = <T extends unknown>(value: T): T =>
  isObject(value) ? reactive(value as object) : value;

/**
 * 检查一个对象是否是由 reactive()、readonly()、shallowReactive() 或 shallowReadonly() 创建的代理。
 * @param value
 * @see {@link https://cn.vuejs.org/api/reactivity-utilities#isproxy}
 */
export function isProxy(value: any): boolean {
  return value ? !!value[ReactiveFlags.RAW] : false;
}

/**
 * 检查传入的值是否为只读对象。
 * @param value
 * @see {@link https://cn.vuejs.org/api/reactivity-utilities#isreadonly}
 */
export function isReadOnly(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_READONLY]);
}
/**
 * 检查一个对象是否是由 reactive() 或 shallowReactive() 创建的代理
 * @param value
 * @see {@link https://cn.vuejs.org/api/reactivity-utilities#isreactive}
 */
export function isReactive(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE]);
}

/**
 * 检查对象是否是由 shallowReactive() 或 shallowReadonly() 创建的代理。
 * @param value
 * @returns
 */
export function isShallow(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_SHALLOW]);
}

type Primitive = string | number | boolean | bigint | symbol | undefined | null;
export type Builtin = Primitive | Function | Date | Error | RegExp;
export declare const ShallowReactiveMarker: unique symbol;
