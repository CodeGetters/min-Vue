/**
 * ====================================================================
 *
 * @file renderer (渲染器)
 *
 * 1、创建渲染器流程
 *    a.createRenderer 会调用 baseCreateRenderer 函数
 *    b.baseCreateRenderer 会返回一个包含 render 和 createApp 方法的对象
 *    c.createApp 会调用 createAppAPI 函数，返回一个带有 mount 方法的应用实例
 * 2、组件的渲染流程
 * ====================================================================
 */
import { createAppAPI } from "./apiCreateApp";
import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "./shapeFlags";

export type Data = Record<string, unknown>;

/**
 * 创建渲染器
 * @param {Object} options - 渲染器选项
 * @returns {Object} 返回一个包含createApp方法的对象
 */
export function createRenderer(options, createHydrationFns?) {
  return baseCreateRenderer(options);
}

function baseCreateRenderer(options, createHydrationFns?): any {
  /**
   * 更新或创建节点
   * @param {VNode | null} n1 - 旧的虚拟节点
   * @param {VNode} n2 - 新的虚拟节点
   * @param {Element} container - 容器元素
   */
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) return;

    const { shapeFlag } = n2;
    if (shapeFlag & ShapeFlags.ELEMENT) {
      processElement(n1, n2, container, anchor);
    } else if (shapeFlag & ShapeFlags.COMPONENT) {
      processComponent(n1, n2, container, anchor);
    }
  };

  const processElement = (n1, n2, container, anchor) => {};

  /**
   * 组件的创建
   * @param n1
   * @param n2
   * @param container
   * @param anchor
   */
  const processComponent = (n1, n2, container, anchor) => {
    if (n1 === null) {
      mountComponent(n2, container, anchor);
    } else {
      updateComponent();
    }
  };

  /**
   * 节点挂载流程：
   * 1、创建组件实例
   * 2、解析数据到实例对象中
   * 3、创建一个 effect 让 renderer 执行
   */
  const mountComponent = (initialVNode, container, anchor) => {
    // 创建组件实例
    const instance = (initialVNode.component =
      createComponentInstance(initialVNode));
    // 解析数据到组件实例中
    setupComponent(instance);

    setupRenderEffect();
  };

  // 组件的更新
  const updateComponent = () => {};

  const setupRenderEffect = () => {};

  const render = (vnode, container, namespace) => {
    console.log("vnode", vnode);
    // 第一次渲染
    patch(null, vnode, container);
  };

  return {
    render,
    createApp: createAppAPI(render),
  };
}
