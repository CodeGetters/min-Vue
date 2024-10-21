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
 * 3、元素挂载流程
 *    a.在 patch 中如果判断节点类型为元素，那么会调用 processElement
 *        i.processElement 会根据旧节点判断是创建【mountElement】还是更新【patchElement】
 *        ii.mountElement 会对 props、children 进行处理，如果有子节点还需要调用 mountChildren
 *        iii.mountChildren 会遍历每一个子节点，同时会对不是 vnode 的子节点调用 normalizeVNode 将其转为 vnode
 *    b.在 patch 方法中，如果节点类型为元素，那么会判断节点属于什么元素类型（这里以Text为例）
 *    c.如果节点是文本，调用 processText 处理文本
 *        i.该方法会判断 n1 是否为 null 以此判断是创建还是更新
 *        ii.如果 n1 不存在，则使用 hostCreateText 创建文本节点，并将文本节点挂载到容器元素中(hostInsert)
 *        iii.如果 n1 存在，则调用 hostSetText 更新文本节点
 *
 * ====================================================================
 */
import { effect } from "@mini/reactivity";
import { createAppAPI } from "./apiCreateApp";
import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "./shapeFlags";
import { normalizeVNode, Text } from "./vnode";

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
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
  } = options;

  /**
   * 更新或创建节点
   * @param {VNode | null} n1 - 旧的虚拟节点
   * @param {VNode} n2 - 新的虚拟节点
   * @param {Element} container - 容器元素
   * @param {Element | null} anchor - 锚点元素（可选）
   */
  const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
    if (n1 === n2) return;

    const { shapeFlag, type } = n2;
    switch (type) {
      case Text:
        // 文本节点
        processText(n1, n2, container, anchor);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 元素
          processElement(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 文本
          processComponent(n1, n2, container, anchor);
        }
    }
  };

  /****************************处理文本**************************/

  const processText = (n1, n2, container, anchor) => {
    if (n1 === null) {
      hostInsert(
        (n2.el = hostCreateText(n2.children as string)),
        container,
        anchor
      );
    } else {
      // 如果旧节点存在，更新文本内容
      const el = (n2.el = n1.el!);
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children as string);
      }
    }
  };

  /****************************处理元素**************************/

  const processElement = (n1, n2, container, anchor, parentComponent) => {
    if (n1 == null) {
      mountElement(n2, container, anchor, parentComponent);
    } else {
      patchElement(n1, n2, parentComponent);
    }
  };

  const mountElement = (vnode, container, anchor, parentComponent) => {
    // 创建元素
    let el = (vnode.el = hostCreateElement(vnode.type));
    const { props, shapeFlag } = vnode;
    if (props) {
      // props 存在，遍历 props 并设置属性
      for (const key in props) {
        if (key !== "value") {
          hostPatchProp(el, key, null, props[key]);
        }
        if ("value" in props) {
          hostPatchProp(el, "value", null, props.value);
        }
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, vnode.children as string);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, null, parentComponent);
    }
    // 插入到容器中
    hostInsert(el, container);
  };

  const patchElement = (n1, n2, parentComponent) => {};

  const mountChildren = (children, container, anchor, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      const child = normalizeVNode(children[i]);
      patch(null, child, container, anchor, parentComponent);
    }
  };

  /****************************处理组件**************************/

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
    setupRenderEffect(instance, initialVNode, container);
  };

  // 组件的更新
  const updateComponent = () => {};

  const setupRenderEffect = (instance, initialVNode, container) => {
    // TODO:
    // 在 effect 中调用 render 以便在 render 中收集依赖
    // 属性改变时，effect 会重新执行
    effect(function componentEffect() {
      // 第一次加载
      if (!instance.isMounted) {
        const proxy = instance.proxy;
        const vnode = instance.render.call(proxy, proxy);
        // console.log("渲染节点 vnode", vnode); --> 这里渲染节点 vnode
        // 渲染子树
        patch(null, vnode, container);
      }
    });
  };

  const render = (vnode, container, namespace) => {
    // 第一次渲染
    patch(null, vnode, container);
  };

  return {
    render,
    createApp: createAppAPI(render),
  };
}
