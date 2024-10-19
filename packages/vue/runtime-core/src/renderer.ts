import { createAppAPI } from "./apiCreateApp";

/**
 * 创建渲染器
 * // TODO：该函数应位于 runtime-core 当中，而不是在 runtime-dom 中
 * @param {Object} options - 渲染器选项
 * @returns {Object} 返回一个包含createApp方法的对象
 */
export function createRenderer(options, createHydrationFns?) {
  const render = () => {};

  return {
    render,
    createApp: createAppAPI(render),
  };
}
