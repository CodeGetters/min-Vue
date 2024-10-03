import { isArray, isIntegerKey, isMap, isSymbol } from "@mini/shared";
import { TriggerOpTypes, TrackOpTypes } from "./constant";
import {
  DebuggerEventExtraInfo,
  Subscriber,
  endBatch,
  startBatch,
} from "./effect";
import { ComputedRefImpl } from "./computed";

export const ITERATE_KEY: unique symbol = Symbol("");
export const ARRAY_ITERATE_KEY: unique symbol = Symbol("");
export const MAP_KEY_ITERATE_KEY: unique symbol = Symbol("");

/**
 * 每一次 reactive 改变都会增加
 * 用于快速计算避免没有更改时进行 computed
 */
export let globalVersion = 0;

type KeyToDepMap = Map<any, any>;
export const targetMap: WeakMap<object, KeyToDepMap> = new WeakMap();

export class Dep {
  version = 0;
  activeLink?: Link = undefined;
  subs?: Link = undefined;
  subsHead?: Link;
  map?: KeyToDepMap = undefined;
  key?: unknown = undefined;
  sc: number = 0;

  constructor(public computed?: ComputedRefImpl | undefined) {}

  track(debugInfo?: DebuggerEventExtraInfo) {}
  trigger(debugInfo?: DebuggerEventExtraInfo): void {
    this.version++;
    globalVersion++;
    this.notify(debugInfo);
  }
  notify(debugInfo?: DebuggerEventExtraInfo): void {
    startBatch();
    try {
      for (let link = this.subs; link; link = link.prevSub) {
        // if(link.sub.notify()){
        //   ;(link.sub as ComputedRefImpl).dep.notify()
        // }
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

export function track(target: object, type: TrackOpTypes, key: unknown): void {}

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
    // 从未被追踪过（没有依赖），版本号 + 1（更新状态）后返回
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
