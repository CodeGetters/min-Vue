interface VNode {
  tag: string;
  props: object | null;
  children: string | Array<VNode>;
  el?: HTMLElement;
}

/**
 *
 */
function h(
  tag: string,
  props: object | null,
  children: string | Array<VNode>
): VNode {
  return {
    tag,
    props,
    children,
  };
}

/**
 * 挂载虚拟节点到真实dom
 * @param vnode 虚拟节点
 * @param container 容器
 */
function mount(vnode: VNode, container: HTMLElement) {
  const el = (vnode.el = document.createElement(vnode.tag));
  // props
  if (vnode.props) {
    for (const key in vnode.props) {
      const value = vnode.props[key];
      if (key.startsWith("on")) {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    }
  }
  // children
  if (typeof vnode.children === "string") {
    el.textContent = vnode.children;
  } else {
    vnode.children.forEach((child) => {
      mount(child, el);
    });
  }
  container.appendChild(el);
}

/**
 * 新旧虚拟节点对比
 * @param n1
 * @param n2
 */
function patch(n1: VNode, n2: VNode) {
  if (n1.tag === n2.tag) {
    const el = (n2.el = n1.el);
    // props
    const oldProps = n1.props || {};
    const newProps = n2.props || {};

    for (const key in newProps) {
      const oldValue = oldProps[key];
      const newValue = newProps[key];
      if (oldValue !== newValue) {
        el?.setAttribute(key, newValue);
      }
    }
    for (const key in oldProps) {
      if (!(key in newProps)) {
        el?.removeAttribute(key);
      }
    }
    // children
    const oldChildren = n1.children;
    const newChildren = n2.children;
    if (typeof newChildren === "string") {
      if (typeof oldChildren === "string") {
        if (newChildren !== oldChildren) {
          el.textContent = newChildren;
        }
      } else {
        el.textContent = newChildren;
      }
    } else {
      if (typeof oldChildren === "string") {
        el.innerText = "";
        newChildren.forEach((child) => {
          mount(child, el);
        });
      } else {
        // 新旧子元素都是数组(假设没有key)
        const commonLength = Math.min(oldChildren.length, newChildren.length);
        for (let i = 0; i < commonLength; i++) {
          patch(oldChildren[i], newChildren[i]);
        }
        if (newChildren.length > oldChildren.length) {
          newChildren.slice(oldChildren.length).forEach((child) => {
            el && mount(child, el);
          });
        } else {
          oldChildren.slice(newChildren.length).forEach((child) => {
            el && child.el && el.removeChild(child.el);
          });
        }
      }
    }
  } else {
  }
}

export { mount, patch, h };
