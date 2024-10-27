/**
 * ====================================================================
 *
 * @file 声明周期 hook 与 setup 建立关系
 *
 * ====================================================================
 */
import { currentInstance, setCurrentInstance } from "./component";
import { LifecycleHooks } from "./enums";

// 1、返回值是一个函数
const createHook =
  <T extends Function = () => any>(lifecycle: LifecycleHooks) =>
  (hook: T, target: null = currentInstance): void => {
    // 核心就是这个声明周期函数要和组件实例绑定，这样才能在组件实例上找到这个函数
    injectHook(lifecycle, (...args: unknown[]) => hook(...args), target);
  };

export function injectHook(
  type: LifecycleHooks,
  hook: Function & { __weh?: Function },
  target = currentInstance
) {
  if (!target) {
    return;
  }
  const hooks = target[type] || (target[type] = []);

  const wrappedHook = () => {
    setCurrentInstance(target);
    hook();
    setCurrentInstance(null);
  };

  hooks.push(wrappedHook); // hook 就是声明周期中的 fn
}

type CreateHook<T = any> = (hook: T, target?: null) => void;

export const onMounted: CreateHook = createHook(LifecycleHooks.MOUNTED);
export const onUpdated: CreateHook = createHook(LifecycleHooks.UPDATED);
export const onBeforeMount: CreateHook = createHook(
  LifecycleHooks.BEFORE_MOUNT
);
export const onBeforeUpdate: CreateHook = createHook(
  LifecycleHooks.BEFORE_UPDATE
);
