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
