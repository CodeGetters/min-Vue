/**
 * ====================================================================
 *
 * @file h（处理 h 函数的多种类型以便创建 vnode）
 *
 * @example
 * ```js
 * h("div", h('div'));
 * h("div", { class: "hello" });
 * h("div", "hello");
 *
 * h("div", { class: "hello" }, 'hello', 'world');
 * h("div", { class: "hello" }, h('div'));
 * h("div", { class: "hello" }, 'hello');
 * ```
 *
 * ====================================================================
 */
import { isArray, isObject } from "@mini/shared";
import { createVNode, isVNode } from "./vnode";

export function h(type: any, propsOrChildren?: any, children?: any) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        // h("div", h('div'));
        return createVNode(type, null, [propsOrChildren]);
      }
      // h("div", { class: "hello" });
      return createVNode(type, propsOrChildren);
    } else {
      // h("div", "hello");
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      // h("div", { class: "hello" }, 'hello', 'world');
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVNode(children)) {
      // h("div", { class: "hello" }, h('div'));
      children = [children];
    }
    // h("div", { class: "hello" }, 'hello');
    return createVNode(type, propsOrChildren, children);
  }
}
