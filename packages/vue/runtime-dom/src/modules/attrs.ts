/**
 * ====================================================================
 *
 * @file 自定义属性的更新
 *
 * 对于自定义属性的更新，这里只是简单的判断 value 是否为 null 来决定是否移除和新增
 *
 * 补充：对于 svg 等自定义属性还需要额外处理
 *
 * ====================================================================
 */
export function patchAttr(el: Element, key: string, value: any) {
  value === null ? el.removeAttribute(key) : el.setAttribute(key, value);
}
