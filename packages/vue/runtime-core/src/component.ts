/**
 * ====================================================================
 *
 * @file 组件相关（组件实例相关）
 *
 * 1、创建组件实例 createComponentInstance(初始化组件实例对象并返回)
 * 2、解析数据到组件实例（setupComponent）
 *    a.从组件实例 vnode 属性中获取 props、children，将它们解析到组件实例上
 *    b.从 isStatefulComponent 判断组件实例是否为有状态组件
 *        i.判断条件主要为组件实例上 vnode.shapeFlag
 *    c.对于有状态组件，调用 setupStatefulComponent 设置状态
 *        ii.创建组件实例的代理对象---PublicInstanceProxyHandlers(使 render proxy 参数可以直接获取组件实例的属性)
 *        iii.对于有setup 函数的组件，调用 handleSetupResult 处理 setup 函数的返回值（object/function-->setupState/render）-->finishComponentSetup
 *        iv.对于没有 setup 函数的组件，直接调用 finishComponentSetup 完成组件设置
 *    d.finishComponentSetup 完成组件设置
 *
 * ====================================================================
 */
import { EMPTY_OBJ, NOOP, isFunction, isObject } from "@mini/shared";
import { ShapeFlags } from "./shapeFlags";
import { type Data } from "./renderer";
import { TrackOpTypes, track, proxyRefs } from "@mini/libreactive";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { callWithErrorHandling } from "./errorHanding";
import { initProps, normalizePropsOptions } from "./componentProps";
import { createAppContext } from "./apiCreateApp";
import { emit } from "./componentEmits";

let uid = 0;

const emptyAppContext = createAppContext();

/**
 * 创建组件实例
 * @param vnode 虚拟节点
 * @returns 返回创建的组件实例
 */
export function createComponentInstance(vnode, parent) {
  // createAppContext
  const appContext =
    (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
  const type = vnode.type;
  // 创建组件实例对象
  const instance = {
    uid: uid++,
    vnode,
    type,
    parent,
    appContext,
    subTree: null!, // will be set synchronously right after creation
    render: null,
    proxy: null,
    exposed: null,
    withProxy: null,

    accessCache: null!,
    renderCache: [],

    // resolved props and emits options
    propsOptions: normalizePropsOptions(type, appContext),

    // props default value
    propsDefaults: EMPTY_OBJ,

    // inheritAttrs
    inheritAttrs: type.inheritAttrs,

    // state
    ctx: EMPTY_OBJ,
    data: EMPTY_OBJ,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    refs: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    setupContext: null,
    emit: null, // 事件的触发

    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: false,
    isUnmounted: false,
    isDeactivated: false,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null,
  };
  instance.ctx = { _: instance };
  instance.emit = emit.bind(null, instance);
  console.log("==========createComponentInstance=======", instance);

  return instance;
}

/**
 * 解析数据到组件实例
 * @param vnode
 */
export function setupComponent(instance, isSSR = false, optimized = false) {
  console.log("---------setupComponent---------", instance.props);
  const { props, children } = instance.vnode;
  const isStateful = isStatefulComponent(instance);
  // 根据 props 解析到组件实例上
  initProps(instance, props, isStateful);
  // initSlots(instance, children, optimized)
  instance.children = children;
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
  instance.accessCache = Object.create(null);
  console.log("-------setupStatefulComponent--------", instance);

  // 创建组件实例的代理对象
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
  const { setup } = Component;
  if (setup) {
    // 在setup之前设置 currentInstance
    currentInstance = instance;
    const setupContext = (instance.setupContext =
      setup.length > 1 ? createSetupContext(instance) : null);
    // 调用 setup 函数，传入 props 和 setupContext
    // const setupResult = callWithErrorHandling(setup, instance, [
    //   instance.props,
    // ]);
    setCurrentInstance(instance);
    const setupResult = setup(instance.props, setupContext);
    currentInstance = null;
    setCurrentInstance(null);
    // 调用组件的 render 函数，传入代理对象
    // Component.render(instance.proxy);

    // 处理对于 setup 函数的返回值的两种情况：1、返回一个对象，2、返回一个函数
    handleSetupResult(instance, setupResult);
  } else {
    // 如果组件没有 setup 函数，则直接调用组件的 render 函数，传入代理对象
    finishComponentSetup(instance);
  }
}

export let currentInstance = null;

export const getCurrentInstance = () => currentInstance;

export const setCurrentInstance = (instance) => {
  currentInstance = instance;
};

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

/**
 * 处理 setup 函数的返回结果
 * @param instance 组件实例
 * @param setupResult setup 函数的返回值
 */
export function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    // 如果 setup 返回一个函数，将其作为组件的 render 函数
    instance.render = setupResult;
  } else if (isObject(setupResult)) {
    // 如果 setup 返回一个对象，将其设置为组件的 setupState
    instance.setupState = proxyRefs(setupResult);
  }
  // 完成组件的设置
  finishComponentSetup(instance);
}

/**
 * 完成组件设置
 * @param instance 组件实例
 */
export function finishComponentSetup(instance) {
  const Component = instance.type;
  // 如果组件实例没有 render 函数
  if (!instance.render) {
    // 如果组件实例没有 render 函数但有 template
    if (!instance.render && Component.template) {
      // 这里可能需要编译模板
    }
    // 将组件的 render 函数赋值给实例，如果没有则使用 NOOP（空操作）
    instance.render = Component.render || NOOP;
  }
}

const attrsProxyHandlers: ProxyHandler<any> = {
  get(target: Data, key: string) {
    track(target, TrackOpTypes.GET, "");
    return target[key];
  },
};
