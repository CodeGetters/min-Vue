/**
 * ====================================================================
 *
 * @file renderer (渲染器)
 *
 * 1、创建渲染器流程
 *    a.createRenderer 会调用 baseCreateRenderer 函数
 *    b.baseCreateRenderer 会返回一个包含 render 和 createApp 方法的对象
 *    c.createApp 会调用 createAppAPI 函数，返回一个带有 mount 方法的应用实例
 *
 * ====================================================================
 */
import { createAppAPI } from "./apiCreateApp";

/**
 * 创建渲染器
 * // TODO：该函数应位于 runtime-core 当中，而不是在 runtime-dom 中
 * @param {Object} options - 渲染器选项
 * @returns {Object} 返回一个包含createApp方法的对象
 */
export function createRenderer(options, createHydrationFns?) {
  return baseCreateRenderer(options);
}

function baseCreateRenderer(options, createHydrationFns?): any {
  const render = (vnode, container) => {};

  return {
    render,
    createApp: createAppAPI(render),
  };
}
