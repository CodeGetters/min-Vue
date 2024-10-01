const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (
  val: object,
  key: string | symbol
): key is keyof typeof val => hasOwnProperty.call(val, key);

export const isArray: typeof Array.isArray = Array.isArray;
export const isSymbol = (val: unknown): val is string =>
  typeof val === "string";
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === "object";

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
