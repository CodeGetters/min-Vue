import { EMPTY_OBJ, hasOwn } from "@mini/shared";
import { Data } from "./renderer";
import { warn } from "./warning";

enum AccessTypes {
  OTHER,
  SETUP,
  DATA,
  PROPS,
  CONTEXT,
}

/**
 * 公共实例代理处理器
 * 用于处理组件实例的属性访问和设置
 */
export const PublicInstanceProxyHandlers: ProxyHandler<any> = {
  get({ _: instance }, key: string) {
    const { data, props, setupState, accessCache, ctx } = instance;
    // console.log(
    //   "-----------PublicInstanceProxyHandlers get--------",
    //   props,
    //   key
    // );
    let normalizedProps;
    // 非$开头的属性，按照优先级查找 setupState、data、props、ctx
    if (key[0] !== "$") {
      const n = accessCache![key];
      // debugger;
      if (n !== undefined) {
        switch (n) {
          case AccessTypes.SETUP:
            return setupState[key];
          case AccessTypes.DATA:
            return data[key];
          case AccessTypes.CONTEXT:
            return ctx[key];
          case AccessTypes.PROPS:
            return props![key];
        }
      } else if (hasSetupBinding(setupState, key)) {
        accessCache![key] = AccessTypes.SETUP;
        return setupState[key];
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
        accessCache![key] = AccessTypes.DATA;
        return data[key];
        // TODO: bug
      } else if (
        (normalizedProps = instance.propsOptions[0]) &&
        hasOwn(normalizedProps, key)
      ) {
        accessCache![key] = AccessTypes.PROPS;
        return props![key];
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        accessCache![key] = AccessTypes.CONTEXT;
        return ctx[key];
      }
    }
  },
  set({ _: instance }, key: string, value: any) {
    const { data, setupState, ctx } = instance;
    // console.log(
    //   "-----------PublicInstanceProxyHandlers set--------",
    //   setupState
    // );
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
