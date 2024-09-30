import { ReactiveFlags } from "./constant";
import { toRawType, isObject } from "@mini/shared";

export interface Target {
  [ReactiveFlags.SKIP]?: boolean;
  [ReactiveFlags.RAW]?: boolean;
  [ReactiveFlags.IS_REF]?: boolean;
  [ReactiveFlags.IS_REACTIVE]?: boolean;
  [ReactiveFlags.IS_READONLY]?: boolean;
}
enum TargetType {
  INVALID = 0,
  COMMON = 1,
  COLLECTION = 2,
}

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
