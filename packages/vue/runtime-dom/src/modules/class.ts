/**
 * ====================================================================
 *
 * @file class 更新
 *
 * class 的更新不用考虑太多，只需要判断当前的 value 是否为 null 如果为 null，
 * 则移除掉 class 属性，如果不为 null 则直接将 value 赋值给 class 属性即可
 *
 * 补充：这里其实还需要考虑当前的 class 是否属于【过渡类名】，如果是过渡的 class
 * 还需要将 value 合并到 transitionClass 中并将其作为 class 属性值
 *
 * ====================================================================
 */
// TODO：
export function patchClass(el: Element, value: string | null): void {
  value ? (el.className = value) : el.removeAttribute("class");
}
