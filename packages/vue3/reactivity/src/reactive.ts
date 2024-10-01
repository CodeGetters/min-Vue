import { ReactiveFlags } from "./constant";
import { toRawType, isObject } from "@mini/shared";
import { mutableHandlers } from "./baseHandlers";
import { mutableCollectionHandlers } from "./collectionHandlers";

export interface Target {
  [ReactiveFlags.RAW]?: any;
  [ReactiveFlags.SKIP]?: boolean;
  [ReactiveFlags.IS_REACTIVE]?: boolean;
  [ReactiveFlags.IS_READONLY]?: boolean;
  [ReactiveFlags.IS_SHALLOW]?: boolean;
}
enum TargetType {
  INVALID = 0,
  COMMON = 1,
  COLLECTION = 2,
}

const reactiveMap: WeakMap<Target, any> = new WeakMap<Target, any>();

export function reactive(target: object) {
  if (isReadOnly(target)) {
    // 只读的对象则直接返回
    return target;
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap
  );
}

/**
 * 创建响应式对象
 * ps:
 * Map、Set、WeakMap、WeakSet 使用 collectionHandlers
 * Object、Array 使用 baseHandlers
 * @param target 需要代理的对象
 * @param isReadOnly 当前创建的响应式对象是否只读
 * @param baseHandlers 普通对象的拦截处理
 * @param collectionHandlers 集合对象的拦截处理
 * @param proxyMap 存储当前响应式对象的缓存
 * @returns
 */
export function createReactiveObject(
  target: Target,
  isReadOnly: boolean,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>
) {
  if (!isObject(target)) {
    // 非对象类型直接返回
    return target;
  }
  if (
    target[ReactiveFlags.RAW] &&
    !(isReadOnly && target[ReactiveFlags.IS_REACTIVE])
  ) {
    // 对象已经是响应式，直接返回
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    // 对象已经有相应的代理，直接返回
    return existingProxy;
  }
  const targetType = getTargetType(target);
  if (targetType === TargetType.INVALID) {
    // 当前对象类型是【函数、其他对象】就直接返回
    return target;
  }
  const proxy = new Proxy(
    target,
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers
  );
  // 缓存当前响应式对象
  proxyMap.set(target, proxy);
  return proxy;
}

/**
 * 根据原始类型字符串确定目标类型
 * @param rawType 原始类型字符串
 * @returns 对应的 TargetType 枚举值
 */
function targetTypeMap(rawType: string) {
  switch (rawType) {
    case "Object":
    case "Array":
      return TargetType.COMMON;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return TargetType.COLLECTION;
    default:
      return TargetType.INVALID;
  }
}

/**
 * 获取目标对象的类型
 * @param value 目标对象
 * @returns 返回目标对象的类型（TargetType枚举值）
 */
function getTargetType(value: Target) {
  return value[ReactiveFlags.SKIP] || !Object.isExtensible(value)
    ? TargetType.INVALID
    : targetTypeMap(toRawType(value));
}

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
