import { EMPTY_OBJ, hasOwn } from "@mini/shared";
import { Data } from "./renderer";
import { warn } from "./warning";

/**
 * 公共实例代理处理器
 * 用于处理组件实例的属性访问和设置
 */
export const PublicInstanceProxyHandlers: ProxyHandler<any> = {
  get({ _: instance }, key: string) {
    const { data, props, setupState, ctx } = instance;
    // 非$开头的属性，按照优先级查找 setupState、data、props、ctx
    if (key[0] !== "$") {
      if (hasSetupBinding(setupState, key)) {
        return setupState[key];
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
        return data[key];
      } else if (hasOwn(props, key)) {
        return props![key];
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        return ctx[key];
      }
    }
  },
  set({ _: instance }, key: string, value: any) {
    const { data, setupState, ctx } = instance;
    // 按照优先级设置属性值 setupState、data、ctx（props 是只读的，不能进行修改）
    if (hasSetupBinding(setupState, key)) {
      setupState[key] = value;
      return true;
    } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if (hasOwn(instance.props, key)) {
      warn(`Propx are readonly ${key}.`, "PublicInstanceProxyHandlers");
      return false;
    } else {
      ctx[key] = value;
    }
  },
};

/***
 * 检查给定的 setup 对象中是否存在指定的键
 *
 * 这里并没有考虑[脚本设置对象](state.__isScriptSetup)
 *
 * @param state - 要检查的状态对象
 * @param key - 要查找的键
 * @returns 如果状态对象不为空且包含指定的键，则返回true；否则返回false
 */
const hasSetupBinding = (state: Data, key: string) =>
  state !== EMPTY_OBJ && hasOwn(state, key);
