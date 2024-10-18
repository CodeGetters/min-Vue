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

export const isPlainObject = (val: unknown): val is object =>
  toTypeString(val) === "[object Object]";
export const isFunction = (val: unknown): val is Function =>
  typeof val === "function";
export const isString = (val: unknown): val is string =>
  typeof val === "string";
export const isMap = (val: unknown): val is Map<any, any> =>
  toTypeString(val) === "[object Map]";
export const isSet = (val: unknown): val is Set<any> =>
  toTypeString(val) === "[object Set]";
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

/**
 * 判断一个字符串是否以 "on" 开头，后面跟着一个大写字母
 * @param key 要检查的字符串
 * @returns {boolean} 如果符合条件返回 true，否则返回 false
 */
export const isOn = (key: string): boolean =>
  key.charCodeAt(0) === 111 /* o */ &&
  key.charCodeAt(1) === 110 /* n */ &&
  // 检查第三个字符是否为大写字母
  (key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);

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

/**
 * 创建一个缓存字符串函数的高阶函数
 * @template T 继承自接受字符串并返回字符串的函数类型
 * @param {T} fn 要缓存的原始函数
 * @returns {T} 返回一个新的函数，具有缓存功能
 */
const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
  // 创建一个没有原型的空对象，避免原型链上的污染
  const cache = Object.create(null);
  return ((str) => {
    const hit = cache[str];
    // 如果缓存命中则返回缓存的结果，否则调用原函数并缓存结果
    return hit || (cache[str] = fn(str));
  }) as T;
};

/**
 * 匹配大写字母前的位置
 * \B 匹配非单词边界 eg: 'camelCase' 匹配 'm C'
 * [A-Z] 匹配任意大写字母
 * () 将匹配的字符串包裹起来
 * g 全局匹配
 *
 * eg:camelCaseString--> ['C', 'S']
 */
const hyphenateRE = /\B([A-Z])/g;

/**
 * 将驼峰式命名的字符串转换为连字符式命名(+ 缓存)
 * eg：'camelCase' -> 'camel-case'
 *
 * @param {string} str 要转换的字符串
 * @returns {string} 转换后的字符串
 */
export const hyphenate = cacheStringFunction((str) =>
  // 将每个匹配到的大写字母替换为连字符加上该大写字母
  // eg: 'camelCase' -> 'camel-Case'
  str.replace(hyphenateRE, "-$1").toLowerCase()
);

/**
 * 匹配连字符后的字符
 * - 匹配连字符
 * \W 匹配非单词字符（包括空格）
 * () 将匹配的字符串包裹起来
 * g 全局匹配
 *
 * eg：foo-bar--> ['B', 'R']
 */
const camelizeRE = /-(\W)/g;

/**
 * 将连字符式命名的字符串转换为驼峰式命名(+ 缓存)
 * eg：'foo-bar' -> 'fooBar'
 *
 * @param {string} str 要转换的字符串
 * @returns {string} 转换后的字符串
 */
export const camelize = cacheStringFunction((str) => {
  /**
   * _ 表示匹配到的整个子串（连字符和其后的单词字符）c 表示捕获组中的单词字符
   * @example
   * ```
   * kebab-same -->['-s']
   * _ : '-s'
   * c : 's'
   * S
   * res->kebabSame
   * ```
   */
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ""));
});
