import { EMPTY_OBJ } from "@mini/shared";
import { ShapeFlags } from "./shapeFlags";
import { type Data } from "./renderer";
import { TrackOpTypes, track } from "@mini/reactivity";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

let uid = 0;

/**
 * 创建组件实例
 * @param vnode 虚拟节点
 * @returns 返回创建的组件实例
 */
export function createComponentInstance(vnode) {
  const type = vnode.type;
  // 创建组件实例对象
  const instance = {
    uid: uid++,
    vnode,
    type,

    // state
    ctx: EMPTY_OBJ,
    data: EMPTY_OBJ,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    refs: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    setupContext: null,

    // 生命周期钩子标志
    // 这里不使用枚举是因为它会导致计算属性
    isMounted: false,
    isUnmounted: false,
    isDeactivated: false,
  };
  instance.ctx = { _: instance };

  return instance;
}

/**
 * 解析数据到组件实例
 * @param vnode
 */
export function setupComponent(instance, isSSR = false, optimized = false) {
  const { props, children } = instance.vnode;
  // 根据 props 解析到组件实例上
  // initProps(instance, props, isStateful, isSSR)
  // initSlots(instance, children, optimized)
  instance.props = props;
  instance.children = children;
  const isStateful = isStatefulComponent(instance);
  const setupResult = isStateful ? setupStatefulComponent(instance) : undefined;

  return setupResult;
}

/**
 * 判断组件实例是否为有状态组件
 * @param instance 组件实例
 * @returns 返回一个数字，表示是否为有状态组件
 */
export function isStatefulComponent(instance): number {
  // 通过位运算判断组件的 shapeFlag 是否包含 STATEFUL_COMPONENT 标志
  return instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
}

/**
 * 设置有状态组件
 * @param instance 组件实例
 */
function setupStatefulComponent(instance) {
  const Component = instance.type;
  // instance.accessCache = Object.create(null);

  // 创建组件实例的代理对象
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
  const { setup } = Component;

  if (setup) {
    const setupContext = (instance.setupContext =
      setup.length > 1 ? createSetupContext(instance) : null);
    // 调用 setup 函数，传入 props 和 setupContext
    setup(instance.props, setupContext);
    // 调用组件的 render 函数，传入代理对象
    Component.render(instance.proxy);
  }
}

/**
 * 创建组件的 setup 上下文
 * @param instance 组件实例
 * @returns 返回包含 attrs、slots、emit 和 expose 的上下文对象
 */
export function createSetupContext(instance) {
  // 定义 expose 函数，用于暴露组件实例的属性
  const expose = (exposed) => {
    instance.exposed = exposed || {};
  };
  return {
    attrs: new Proxy(instance.attrs, attrsProxyHandlers),
    slots: instance.slots,
    emit: instance.emit,
    expose,
  };
}

export function handleSetupResult() {}

export function finishComponentSetup() {}

const attrsProxyHandlers: ProxyHandler<any> = {
  get(target: Data, key: string) {
    track(target, TrackOpTypes.GET, "");
    return target[key];
  },
};
