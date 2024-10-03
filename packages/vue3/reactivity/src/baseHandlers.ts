/**
 *
 *
 *
 */
import {
  hasOwn,
  isArray,
  isIntegerKey,
  isObject,
  isSymbol,
} from "@mini/shared";
import { ReactiveFlags, TrackOpTypes, TriggerOpTypes } from "./constant";
import {
  isReadOnly,
  isShallow,
  reactive,
  reactiveMap,
  readonly,
  readonlyMap,
  toRaw,
  type Target,
} from "./reactive";
import { arrayInstrumentations } from "./arrayInstrumentations";
import { makeMap } from "./makeMap";
import { ITERATE_KEY, track, trigger } from "./dep";
import { isRef } from "./ref";
import { hasChanged } from "@mini/shared/src/general.js";

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

/**
 * 实现 ProxyHandler 接口，用于处理响应式对象的基本操作
 *
 * @example
 * ```js
 * const obj = { name: 'zs', zge: 1 }
 * const handler = new BaseReactiveHandler()
 * const proxy = new Proxy(obj, handler)
 * console.log(proxy.name) // Getting zs!
 * console.log(proxy.zge) // Getting 1
 * ```
 */
class BaseReactiveHandler implements ProxyHandler<Target> {
  constructor(
    protected readonly _isReadonly = false,
    protected readonly _isShallow = false
  ) {}

  /**
   * 根据响应式特殊的标记值分别进行相应的处理
   * 对数组进行特殊处理
   * 使用 Reflect.get 获取目标对象 key
   * 在获取属性值时调用 track 进行依赖收集
   *
   * @param target 被代理的原始对象
   * @param key 需要获取的属性名
   * @param receiver 代理对象本身
   *
   * @example
   * ```js
   * const obj = { name: 'zs', zge: 1 }
   * const handler = {
   *    get: function (target, key, receiver) {
   *        console.log(`Getting ${key}!`)
   *        return Reflect.get(target, key, receiver)
   *    }
   * }
   * const proxy = new Proxy(obj, handler)
   * console.log(proxy.name) // Getting zs!
   * console.log(proxy.zge) // Getting 1
   * ```
   */
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
  const obj = toRaw(this);
  track(obj, TrackOpTypes.HAS, key);
  return obj.hasOwnProperty(key as string);
}

class MutableReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow = false) {
    super(false, isShallow);
  }

  /**
   *
   * @param target 需要进行 set 的目标对象
   * @param key 需要进行 set 的目标对象 key
   * @param value 修改后 set 后目标对象 key 对应的值
   * @param receiver 代理对象 proxy
   * @returns
   */
  set(
    target: Record<string | symbol, unknown>,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    let oldValue = target[key];
    // 边界检查
    if (!this._isShallow) {
      const isOldValueReadonly = isReadOnly(oldValue);
      if (!isShallow(value) && !isReadOnly(value)) {
        oldValue = toRaw(oldValue);
        value = toRaw(value);
      }
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        if (isOldValueReadonly) {
          return false;
        } else {
          oldValue.value = value;
          return true;
        }
      }
    }
    const hadKey =
      isArray(target) && isIntegerKey(key) ? Number(key) : hasOwn(target, key);
    const result = Reflect.set(
      target,
      key,
      value,
      isRef(target) ? target : receiver
    );
    /**
     * 防止在原型链上的属性被修改时触发响应，以确保不会触发两次
     *
     * @example
     *
     * ```js
     * const obj = {}
     * const proto = { a: 1 }
     * const parent = reactive(proto),child = reactive(obj)
     * // child.__proto__ = parent
     * Object.setPrototypeOf(child,parent)
     *
     * effect(()=>{
     *    // child 原对象中并没有 a 属性，但其 __proto__ 中有，所以就会到其原型上找 a 属性
     *    // 这就导致了触发了两次 trigger（child、parent 都是响应式对象，所以会触发两次）
     *    // 所以就检查目标对象和代理对象的原型来避免减少触发次数
     *    console.log(child.a)
     * })
     * ```
     */
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, value);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, TriggerOpTypes.SET, key, value, oldValue);
      }
    }
    // console.log('触发依赖')
    return result;
  }

  // deleteProperty(
  //   target: Record<string | symbol, unknown>,
  //   key: string | symbol
  // ) {}

  // has(target: Record<string | symbol, unknown>, key: string | symbol) {}

  ownKeys(target: Record<string | symbol, undefined>): (string | symbol)[] {
    track(
      target,
      TrackOpTypes.ITERATE,
      isArray(target) ? "length" : ITERATE_KEY
    );
    return Reflect.ownKeys(target);
  }
}

class ReadonlyReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow = false) {
    super(true, isShallow);
  }
  set(target: object, key: string | symbol) {
    return true;
  }
  deleteProperty(target: object, key: string | symbol) {
    return true;
  }
}

export const mutableHandlers: ProxyHandler<object> =
  new MutableReactiveHandler();

export const readonlyHandlers: ProxyHandler<object> =
  new ReadonlyReactiveHandler();
