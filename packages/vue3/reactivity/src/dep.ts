import { isArray, isIntegerKey, isMap, isSymbol } from "@mini/shared";
import { TriggerOpTypes } from "./constant";
import {
  DebuggerEventExtraInfo,
  ReactiveEffect,
  Subscriber,
  activeEffect,
  activeSub,
  endBatch,
  shouldTrack,
  startBatch,
} from "./effect";
import { ComputedRefImpl } from "./computed";

export const ITERATE_KEY: unique symbol = Symbol("");
export const ARRAY_ITERATE_KEY: unique symbol = Symbol("");
export const MAP_KEY_ITERATE_KEY: unique symbol = Symbol("");

export let globalVersion = 0;

type KeyToDepMap = Map<any, any>;
// 记录响应式对象所依赖的的依赖关系
export const targetMap: WeakMap<object, KeyToDepMap> = new WeakMap();

export class Dep {
  version = 0;
  /**
   * 当前活动的副作用函数与这个依赖之间的链接
   */
  activeLink?: Link = undefined;
  /**
   *
   */
  subs?: Link = undefined;
  /**
   *
   */
  subsHead?: Link;
  /**
   *
   */
  target: unknown = undefined;
  map?: KeyToDepMap = undefined;
  key?: unknown = undefined;
  /**
   * 订阅者数量
   */
  sc: number = 0;

  constructor(public computed?: ComputedRefImpl | undefined) {}

  // TODO：
  track(debugInfo?: DebuggerEventExtraInfo): Link | undefined {
    if (!activeSub || !shouldTrack || activeSub === this.computed) {
      return;
    }
    let link = this.activeLink;
    if (link === undefined || link.sub !== activeSub) {
      link = this.activeLink = new Link(activeSub as Subscriber, this);

      if (!(activeSub as Subscriber).deps) {
        (activeSub as Subscriber).deps = (activeSub as Subscriber).depsTail =
          link;
      } else {
        link.prevDep = (activeSub as Subscriber).depsTail;
        (activeSub as Subscriber).depsTail!.nextDep = link;
        (activeSub as Subscriber).depsTail = link;
      }

      // addSub(link);
    } else if (link.version === -1) {
      // reused from last run - already a sub, just sync version
      link.version = this.version;

      // If this dep has a next, it means it's not at the tail - move it to the
      // tail. This ensures the effect's dep list is in the order they are
      // accessed during evaluation.
      if (link.nextDep) {
        const next = link.nextDep;
        next.prevDep = link.prevDep;
        if (link.prevDep) {
          link.prevDep.nextDep = next;
        }

        link.prevDep = activeSub.depsTail;
        link.nextDep = undefined;
        activeSub.depsTail!.nextDep = link;
        activeSub.depsTail = link;

        // this was the head - point to the new head
        if (activeSub.deps === link) {
          activeSub.deps = next;
        }
      }
    }
    // return this.activeLink;
    return link;
  }
  trigger(debugInfo?: DebuggerEventExtraInfo): void {
    this.version++;
    globalVersion++;
    this.notify(debugInfo);
  }
  notify(debugInfo?: DebuggerEventExtraInfo): void {
    startBatch();
    try {
      for (let link = this.subs; link; link = link.prevSub) {
        if (link.sub.notify()) {
          (link.sub as ComputedRefImpl).dep.notify();
        }
      }
    } finally {
      endBatch();
    }
  }
}

export class Link {
  version: number;
  prevSub?: Link;
  nextSub?: Link;
  nextDep?: Link;
  prevDep?: Link;
  prevActiveLink?: Link;

  constructor(public sub: Subscriber, public dep: Dep) {
    this.version = dep.version;
    this.nextDep =
      this.prevDep =
      this.nextSub =
      this.prevSub =
      this.prevActiveLink =
        undefined;
  }
}

/**
 * 依赖 effect 跟踪
 *
 * 建立响应式属性和副作用函数之间的依赖关系，当响应式属性的值发生变化时，可以通过依赖关系找到所有依赖于这个属性的副作用函数，并重新执行这些副作用函数
 * @param target 响应式对象
 * @param key 要跟踪的响应式属性的标识符
 */
export function track(target: object, key: unknown): void {
  if (shouldTrack && activeSub) {
    // 获取当前目标对象的依赖映射
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      // 如果没有依赖项，则创建一个新的 Map 对象来存储依赖关系来进行一一对应依赖
      targetMap.set(target, (depsMap = new Map()));
    }
    // 获取特定 key 的依赖集合
    let dep: Dep | undefined = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = new Dep()));
      dep.target = target;
      dep.map = depsMap;
      dep.key = key;
    }
    dep.track();
  }
}

/**
 * 触发 effect 更新（数组更新、对象更新...）
 * 对响应式对象进行操作时，找到与该操作相关的所有依赖项，并触发它们的效果，以实现响应式系统的更新
 * @param target 响应式对象
 * @param type 定义需要触发效果的操作的类型（ADD、SET等）
 * @param key 用于针对目标对象中的特定属性
 *
 * @example
 * ```js
 * const reactiveObj = reactive({ a: 1, b: 2})
 * reactiveObj.a = 2
 * // 自动执行进行更新
 * // trigger(reactiveObj, TriggerOpTypes.SET, 'a', 2)
 * ```
 */
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>
): void {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    // 从未被追踪过（没有依赖）
    globalVersion++;
    return;
  }
  const run = (dep: Dep | undefined) => {
    if (dep) {
      dep.trigger();
    }
  };
  startBatch();
  if (type === TriggerOpTypes.CLEAR) {
    // 响应式对象被清空，触发所有的副作用函数
    depsMap.forEach(run);
  } else {
    const targetIsArray = isArray(target);
    const isArrayIndex = targetIsArray && isIntegerKey(key);
    // 看看是不是修改的数组的长度
    if (targetIsArray && key === "length") {
      /**
       * 数组的 length 属性被修改时，找到并执行所有可能受到影响的副作用函数
       *
       * @example
       * ```js
       * const state = reactive({ arr:[1, 2, 3] })
       * state.arr.length = 2
       * // 触发所有依赖于数组的副作用函数
       * state.arr[2] = undefined
       * ```
       */
      const newLength = Number(newValue);
      depsMap.forEach((dep, key) => {
        if (
          key === "length" ||
          key === ARRAY_ITERATE_KEY ||
          (!isSymbol(key) && key >= newLength)
        ) {
          run(dep);
        }
      });
    } else {
      // 使用 void 0 代表 undefined 好处是 void 0 为 6 byte undefined为 9 byte
      if (key !== void 0) {
        run(depsMap.get(key));
      }
      if (isArrayIndex) {
        run(depsMap.get(ARRAY_ITERATE_KEY));
      }

      switch (type) {
        case TriggerOpTypes.ADD:
          /**
           * 处理对象|Map的添加操作
           *
           * @example
           * ```js
           * const state = reactive({key1:'key1', key2:'key2', key3:'key3'})
           * data.key4 = 'key4' // 当添加属性时，直接将 key 作为 iterate_key|map_key_iterate_key 的依赖放进要执行的 effects 中
           * ```
           */
          if (!targetIsArray) {
            run(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              run(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          } else if (isArrayIndex) {
            /**
             * 处理数组以下标值的添加操作
             * @example
             * ```js
             * const state = reactive({ arr:[1, 2, 3] })
             * state.arr[3] = 5
             */
            run(depsMap.get("length"));
          }
          break;
        case TriggerOpTypes.DELETE:
          if (!targetIsArray) {
            run(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              run(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          }
          break;
        case TriggerOpTypes.SET:
          if (isMap(target)) {
            run(depsMap.get(ITERATE_KEY));
          }
          break;
      }
    }
  }
  endBatch();
}
