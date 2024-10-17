/**
 * ====================================================================
 *
 * @file DOM操作
 *
 * DOM 增 删 改 查
 * 文本内容的 增 改
 *
 * ====================================================================
 */
export const svgNS = "http://www.w3.org/2000/svg";
export const mathmlNS = "http://www.w3.org/1998/Math/MathML";

const doc = (typeof document !== "undefined" ? document : null) as Document;

export const nodeOps = {
  /**
   * 对于 svg 和 mathml 的节点，需要指定命名空间
   * 可以使用 createElementNS 创建节点
   * 这里为了 mini  不考虑 svg、mathml
   * @example
   * ```js
   * doc.createElementNS(mathmlNS, tag) // mathml
   * doc.createElementNS(svgNS, tag) // svg
   * ```
   */
  createElement: (tagName): Element => doc.createElement(tagName),

  remove: (child) => {
    let parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },

  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },

  querySelector: (selector) => doc.querySelector(selector),

  setElementText: (el, text) => (el.textContent = text),

  // 节点文本
  createText: (text) => doc.createTextNode(text),

  setText: (node, text) => (node.nodeValue = text),

  createComment: (text) => doc.createComment(text),

  parentNode: (node) => node.parentNode as Element | null,
};
