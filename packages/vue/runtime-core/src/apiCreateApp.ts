/**
 * ====================================================================
 *
 * @file apiCreateApp (创建渲染器API)
 *
 * createAppAPI 会返回一个带有 mount 方法的对象
 * 1、创建应用实例 app 的函数，同时对 App 实例进行初始化（属性、方法）
 *    a.在 mount 方法中，创建虚拟节点 vnode
 *    b.调用来自 baseCreateRenderer 中的 render 函数，将虚拟节点 vnode 渲染到容器中
 *
 * ====================================================================
 */
import { createVNode } from "./vnode";

let uid = 0;

export function createAppAPI(render, hydrate?) {
  return function createApp(rootComponent, rootProps = null) {
    const context = createAppContext();
    const app = {
      _uid: uid++,
      _component: rootComponent,
      _props: rootProps,
      _container: null,
      _context: context,
      _instance: null,

      mount(rootContainer) {
        const vnode = createVNode(rootComponent, rootProps);
        render(vnode, rootContainer);

        app._container = rootContainer;
      },
    };
    return app;
  };
}

export function createAppContext() {}
