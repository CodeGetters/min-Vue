const hasOwnProperty = Object.prototype.hasOwnProperty;
/**
 * 检查对象（val）中是否具有指定的属性（key）
 * @param val
 * @param key
 */
export const hasOwn = (
  val: object,
  key: string | symbol
): key is keyof typeof val => hasOwnProperty.call(val, key);

export const isString = (val: unknown): val is string =>
  typeof val === "string";
export const isMap = (val: unknown): val is Map<any, any> =>
  toTypeString(val) === "[object Map]";
export const isArray: typeof Array.isArray = Array.isArray;
export const isSymbol = (val: unknown): val is string =>
  typeof val === "string";
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === "object";
// 判断 key 是否是整数
export const isIntegerKey = (key: unknown): boolean =>
  // 首先判断是否是字符串
  isString(key) &&
  // 然后判断是否是 NaN
  key !== "NaN" &&
  // 其次判断第一个字符是否是 '-'（负号）
  key[0] !== "-" &&
  // 最后将字符串转换为整数，如果转换后的值和原始值相等，则说明是整数
  "" + parseInt(key, 10) === key;

export const objectToString: typeof Object.prototype.toString =
  Object.prototype.toString;

/**
 * 获取对象的原始类型字符串
 * @param value
 */
export const toTypeString = (value: unknown): string =>
  objectToString.call(value);

/**
 * 截取对象的原始类型字符串
 *
 * @example
 * ```js
 * const arr = new Array();
 * toTypeString(arr) // "[object Array]"
 * toRawType(arr) // "Array"
 * ```
 * @param value
 */
export function toRawType(value: unknown): string {
  return toTypeString(value).slice(8, -1);
}

export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue);

export const extend: typeof Object.assign = Object.assign;
export const EMPTY_OBJ: { readonly [key: string]: any } = {};

export const remove = <T>(arr: T[], el: T): void => {
  const i = arr.indexOf(el);
  if (i > -1) {
    arr.splice(i, 1);
  }
};
