import { hasOwn } from "@mini/shared";
import { ReactiveFlags } from "./constant";

function createInstrumentations() {
  const mutableInstrumentations = {};
  const readonlyInstrumentation = {};
  return [mutableInstrumentations, readonlyInstrumentation];
}

const [mutableInstrumentations, readonlyInstrumentation] =
  createInstrumentations();

// 创建一个获取器函数，用于处理响应式对象的属性访问
function createInstrumentationGetter(isReadOnly: boolean, shallow: boolean) {
  // 根据是否只读选择相应的拦截器
  const instrumentations = isReadOnly
    ? readonlyInstrumentation
    : mutableInstrumentations;
  // 返回一个代理处理函数
  return (target, key: symbol | string, receiver) => {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadOnly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadOnly;
    } else if (key === ReactiveFlags.RAW) {
      return target;
    }
    // 使用Reflect.get获取属性值，优先使用拦截器中的方法
    return Reflect.get(
      hasOwn(instrumentations, key) && key in target
        ? instrumentations
        : target,
      key,
      receiver
    );
  };
}

export const mutableCollectionHandlers = {
  get: createInstrumentationGetter(false, false),
};

export const readonlyCollectionHandlers = {
  get: createInstrumentationGetter(true, false),
};
