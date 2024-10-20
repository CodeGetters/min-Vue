/**
 * ====================================================================
 *
 * @file style 更新
 *
 * 目前只是简单将其作为字符串处理，并没有去做进一步的处理，
 * 比如：v-show、自定义属性、将对象和字符串两种传递的形式进行分开处理、!important...
 *
 * 这里的处理方式（先清理多余的，然后增加新增的）：
 *     a.判断 next 是否为空，如果为空，则删除 style 属性
 *     b.如果不为空，那么遍历 prev 将 next 中不存在的属性删除
 *     c.遍历 next，将 next 中存在的属性设置到 style 中
 * ====================================================================
 */
// TODO：
type Style = string | Record<string, string | string[]> | null;

export function patchStyle(el: Element, prev, next) {
  console.log("style", prev, next);
  const style = (el as HTMLElement).style;
  //   const isStringClass = isString(next);
  if (next == null) {
    el.removeAttribute("style");
  } else {
    if (prev) {
      for (const key in prev) {
        if (next[key] == null) {
          delete style[key];
        }
      }
    }
    for (const key in next) {
      style[key] = next[key];
    }
  }
}
