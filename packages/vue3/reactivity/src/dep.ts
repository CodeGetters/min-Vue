import { TriggerOpTypes } from "./constant";
import {
  DebuggerEventExtraInfo,
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

/**
 * 每一次 reactive 改变都会增加
 * 用于快速计算避免没有更改时进行 computed
 */
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
  subs?: Link = undefined;
  subsHead?: Link;
  map?: KeyToDepMap = undefined;
  key?: unknown = undefined;
  sc: number = 0;

  constructor(public computed?: ComputedRefImpl | undefined) {}

  track(debugInfo?: DebuggerEventExtraInfo): Link | undefined {
    if (activeSub || !shouldTrack || activeSub === this.computed) {
      return;
    }
    let link = this.activeLink;
    if (link === undefined || link.sub !== activeSub) {
      // link = this.activeLink = new Link(activeSub, this);
      // if (!activeSub.deps) {
      //   activeSub.deps = activeSub.depsTail = link;
      // } else {
      //   link.prevDep = activeSub.depsTail;
      //   activeSub.depsTail!.nextDep = link;
      //   activeSub.depsTail = link;
      // }
      // addSub(link);
    } else if (link.version === -1) {
      link.version = this.version;
      if (link.nextDep) {
        const next = link.nextDep;
        next.prevDep = link.prevDep;
        if (link.prevDep) {
          link.prevDep.nextDep = next;
        }
        // link.prevDep = activeSub.depsTail;
        link.nextDep = undefined;
        // activeSub.depsTail!.nextDep=link
        // activeSub.depsTail = link;

        // if (activeSub.deps === link) {
        //   activeSub.deps = next;
        // }
      }
    }

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
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = new Set()));
    }
  }
}

export function trackEffects(dep) {
  if (dep.has()) return;
  dep.add(activeEffect);
  // activeEffect?.deps.push(dep);
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
  let dep = depsMap?.get(key);
  triggerEffects(dep);
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
