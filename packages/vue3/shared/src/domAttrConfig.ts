/**
 * 判断某个值是否应该被视为布尔属性
 * e.g. `<select multiple>` 会被编译未 `{ multiple: '' }`
 */
export function includeBooleanAttr(value: unknown): boolean {
  return !!value || value === "";
}
