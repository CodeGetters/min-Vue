import { ShapeFlags } from "./shapeFlags";
import { normalizeVNode } from "./vnode";

/**
 * 渲染组件根节点的函数
 * @param instance
 * @returns
 */
export function renderComponentRoot(instance) {
  const {
    vnode,
    withProxy,
    proxy,
    renderCache,
    props,
    render,
    setupState,
    data,
    ctx,
    attrs,
    inheritAttrs,
  } = instance;
  let result;
  let fallthroughAttrs;

  // 检查是否为有状态组件
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 确定要使用的代理对象
    const proxyToUse = withProxy || proxy;

    // 调用渲染函数并规范化结果
    result = normalizeVNode(
      render!.call(
        proxyToUse,
        proxyToUse,
        renderCache,
        props,
        setupState,
        data,
        ctx
      )
    );
    fallthroughAttrs = attrs;
  }

  // 处理继承的属性
  if (fallthroughAttrs && inheritAttrs !== false) {
    result.props = {
      ...result.props,
      ...fallthroughAttrs,
    };
  }
  return result;
}
