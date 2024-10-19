/**
 * ====================================================================
 *
 * @file runtime-dom.ts
 * 该文件包含了与DOM相关的运行时功能，包括创建应用、渲染器和容器规范化等
 *
 * ====================================================================
 */
import { extend, isString } from "@mini/shared";
import { nodeOps } from "./nodeOps";
import { patchProps } from "./patchOps";
import { createRenderer } from "@mini/runtime-core";

// 创建渲染器选项，合并 patchProps 和 nodeOps
const rendererOptions = /*@__PURE__*/ extend({ patchProps }, nodeOps);

/**
 * 创建应用的函数，返回一个带有自定义mount方法的应用实例
 * @param {...any} args - 传递给createApp的参数---rootComponent、rootProps
 * @returns {Object} 返回一个应用实例
 */
export const createApp = (...args) => {
  // 使用ensureRenderer()获取渲染器，并调用其createApp方法创建应用实例
  const app = ensureRenderer().createApp(...args);
  const { mount } = app;
  // 重写mount方法
  app.mount = (containerOrSelector: Element | ShadowRoot | string): any => {
    const container = normalizeContainer(containerOrSelector);
    if (!container) return;

    // 在挂载前，清空容器的内容
    // nodeType === 1 表明是一个元素节点 eg：<p>|<div>
    if (container.nodeType === 1) {
      container.textContent = "";
    }
    mount(container);
  };
  return app;
};

let renderer;
/**
 * 懒加载创建渲染器 renderer（在需要时才进行某些操作，而不是在初始化时立即进行）
 * ```js
 * // 这里 ensureRenderer 和 createRenderer 函数都不会调用
 * // 所以它们的代码都会被 tree-shaking 掉（在打包产物中不会包含它们）
 * import { reactive } from 'vue'
 * const state = reactive({ count: 0 })
 * ```
 * @returns {Object} 返回渲染器对象
 */
function ensureRenderer() {
  // 如果renderer已存在则直接返回，否则创建一个新的渲染器
  return renderer || (renderer = createRenderer(rendererOptions));
}

/**
 * 规范化容器
 * @param container 可以是Element、ShadowRoot或字符串选择器
 * @returns 返回规范化后的容器元素，如果是字符串则返回对应的DOM元素，否则直接返回输入的容器
 */
function normalizeContainer(
  container: Element | ShadowRoot | string
): Element | ShadowRoot | null {
  if (isString(container)) {
    return document.querySelector(container);
  }
  return container;
}
