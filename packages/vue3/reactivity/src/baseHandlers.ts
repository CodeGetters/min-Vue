import { isArray, isObject, isSymbol } from "@mini/shared";
import { ReactiveFlags, TrackOpTypes } from "./constant";
import {
  reactive,
  reactiveMap,
  readonly,
  readonlyMap,
  type Target,
} from "./reactive";
import { arrayInstrumentations } from "./arrayInstrumentations";
import { makeMap } from "./makeMap";
import { track } from "./dep";
import { isRef } from "./ref";

const isNonTrackableKeys = makeMap(`__proto__,__v_isRef,__isVue`);

// 创建一个包含内置 Symbol 值的 Set
const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    // 过滤掉 'arguments' 和 'caller' 属性
    .filter((key) => key !== "arguments" && key !== "caller")
    // 将剩余的属性名映射为对应的 Symbol 值
    .map((key) => Symbol[key as keyof SymbolConstructor])
    // 再次过滤，只保留类型为 symbol 的值
    .filter(isSymbol)
);

class BaseReactiveHandler implements ProxyHandler<Target> {
  constructor(protected readonly _isReadonly = false) {}

  get(target: Target, key: string | symbol, receiver: object): any {
    const isReadOnly = this._isReadonly;

    if (key === ReactiveFlags.IS_REACTIVE) {
      // 当访问的 key 为 __v_isReactive 时直接返回 true
      // 在 createReactiveObject 时要判断是否为响应式对象
      // 如果是响应式对象就必定触发 getter
      return !isReadOnly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadOnly;
    } else if (key === ReactiveFlags.RAW) {
      if (
        receiver === (isReadOnly ? readonlyMap : reactiveMap).get(target) ||
        /**
         * 如果 target 和 receiver 具有相同的原型则认为 receiver 是响应式代理的用户代理
         *
         * ```js
         * const reactiveProxy = new Proxy(target, handler) // 响应式代理对象（如Vue创建的...）
         * const userProxy = new Proxy(reactiveProxy, userHandler) // 响应式代理 reactiveProxy 的用户代理
         * ```
         */
        Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)
      ) {
        // 如果外部访问的是 raw 说明需要的是原对象
        return target;
      }
    }
    const targetIsArray = isArray(target);

    if (!isReadOnly) {
      let fn: Function | undefined;
      if (targetIsArray && (fn = arrayInstrumentations[key])) {
        return fn;
      }
      if (key === "hasOwnProperty") {
        return hasOwnProperty;
      }
    }

    const res = Reflect.get(target, key, receiver);

    if (
      isSymbol(key)
        ? builtInSymbols.has(key as symbol)
        : isNonTrackableKeys(key as string)
    ) {
      return res;
    }

    if (!isReadOnly) {
      track(target, TrackOpTypes.GET, key);
    }
    if (isRef(res)) {
      return;
    }
    if (isObject(res)) {
      return isReadOnly ? readonly(res) : reactive(res);
    }
    return res;
  }
}

function hasOwnProperty(this: object, key: unknown) {
  if (!isSymbol(key)) {
    key = String(key);
  }
}

class MutableReactiveHandler extends BaseReactiveHandler {}

class ReadonlyReactiveHandler extends BaseReactiveHandler {}

export const mutableHandlers: ProxyHandler<object> =
  new MutableReactiveHandler();

export const readonlyHandlers: ProxyHandler<object> =
  new ReadonlyReactiveHandler();
