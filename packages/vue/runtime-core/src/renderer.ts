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
 *    a.render 方法调用 patch 方法，传入 null、虚拟节点、容器元素表示第一次渲染
 *    b.patch 方法根据 n2 的类型选择调用 processElement or processComponent 方法，第一次会调用 processComponent 方法
 *    c.processComponent 方法判断旧节点是否存在，不存在调用 mountComponent
 *    d.mountComponent 方法
 *        i.创建组件实例
 *        ii.解析数据到实例对象中
 *        iii.创建一个 effect 让 renderer 执行
 *
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
/**
 * 基础渲染器创建函数
 * @param {Object} options - 渲染器选项
 * @param {Function} createHydrationFns - 创建hydration函数（可选）
 * @returns {Object} 返回包含render和createApp方法的对象
 */
function baseCreateRenderer(options, createHydrationFns?): any {
  /**
   * 更新或创建节点
   * @param {VNode | null} n1 - 旧的虚拟节点
   * @param {VNode} n2 - 新的虚拟节点
   * @param {Element} container - 容器元素
   * @param {Element | null} anchor - 锚点元素（可选）
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
   * @param {VNode | null} n1 - 旧的虚拟节点
   * @param {VNode} n2 - 新的虚拟节点
   * @param {Element} container - 容器元素
   * @param {Element | null} anchor - 锚点元素
   */
  const processComponent = (n1, n2, container, anchor) => {
    if (n1 === null) {
      // 如果旧节点不存在，说明是首次渲染，调用mountComponent进行挂载
      mountComponent(n2, container, anchor);
    } else {
      // 如果旧节点存在，说明是更新操作，调用updateComponent进行更新
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
    const instance = (initialVNode.component =
      createComponentInstance(initialVNode));
    setupComponent(instance);

    // 设置渲染效果，这里会创建一个 effect 让 renderer 执行
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
