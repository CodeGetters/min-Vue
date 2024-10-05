import { extend, hasChanged } from "@mini/shared";
import { Link } from "./dep";
import { ComputedRefImpl } from "./computed";
import { activeEffectScope } from "./effectScope";

let batchDepth = 0;
let batchedSub: Subscriber | undefined;
const pausedQueueEffects = new WeakSet<ReactiveEffect>();
export let shouldTrack = true;
export let activeSub: Subscriber | undefined;
export let activeEffect: ReactiveEffect | undefined;

export enum EffectFlags {
  ACTIVE = 1 << 0,
  RUNNING = 1 << 1,
  TRACKING = 1 << 2,
  NOTIFIED = 1 << 3,
  DIRTY = 1 << 4,
  ALLOW_RECURSE = 1 << 5,
  PAUSE = 1 << 6,
}

export type EffectScheduler = (...args: any[]) => any;
export interface ReactiveEffectRunner<T = any> {
  (): T;
  effect: ReactiveEffect;
}
export type DebuggerEvent = {
  effect: Subscriber;
} & DebuggerEventExtraInfo;

export type DebuggerEventExtraInfo = {
  target: object;
};

export interface DebuggerOptions {
  onTrack?: (event: DebuggerEvent) => void;
  onTrigger?: (event: DebuggerEvent) => void;
}

export interface Subscriber extends DebuggerOptions {
  deps?: Link;
  depsTail?: Link;
  flags: EffectFlags;
  next?: Subscriber;
  notify(): true | void;
}

export interface ReactiveEffectOptions extends DebuggerOptions {
  scheduler?: EffectScheduler;
  allowRecurse?: boolean;
  onStop?: () => void;
}

export class ReactiveEffect<T = any>
  implements Subscriber, ReactiveEffectOptions
{
  /**
   * @internal
   */
  deps?: Link = undefined;
  /**
   * @internal
   */
  depsTail?: Link | undefined;
  /**
   * @internal
   */
  flags: EffectFlags = EffectFlags.ACTIVE | EffectFlags.TRACKING;
  /**
   * @internal
   */
  next?: Subscriber | undefined;
  /**
   * @internal
   */
  cleanup?: () => void = undefined;
  onStop?: () => void;
  scheduler?: EffectScheduler = undefined;
  constructor(public fn: () => T) {
    if (activeEffectScope && activeEffectScope.active) {
      activeEffectScope.effects.push(this);
    }
  }
  pause(): void {
    this.flags |= EffectFlags.PAUSE;
  }
  resume(): void {
    if (this.flags & EffectFlags.PAUSE) {
      this.flags &= ~EffectFlags.PAUSE;
      if (pausedQueueEffects.has(this)) {
        pausedQueueEffects.delete(this);
        this.trigger();
      }
    }
  }
  notify(): void {
    if (
      this.flags & EffectFlags.RUNNING &&
      !(this.flags & EffectFlags.ALLOW_RECURSE)
    ) {
      return;
    }
    if (!(this.flags & EffectFlags.NOTIFIED)) {
      batch(this);
    }
  }
  run(): T {
    if (!(this.flags & EffectFlags.ACTIVE)) {
      return this.fn();
    }
    this.flags |= EffectFlags.RUNNING;
    cleanupEffect(this);
    prepareDeps(this);
    const prevEffect = activeSub;
    const prevShouldTrack = shouldTrack;
    activeSub = this;
    shouldTrack = true;
    try {
      return this.fn();
    } finally {
      cleanupDeps(this);
      activeSub = prevEffect;
      shouldTrack = prevShouldTrack;
      this.flags &= ~EffectFlags.RUNNING;
    }
  }
  stop() {
    if (this.flags & EffectFlags.ACTIVE) {
      for (let link = this.deps; link; link = link.nextDep) {
        removeSub(link);
      }
      this.deps = this.depsTail = undefined;
      cleanupEffect(this);
      this.onStop && this.onStop();
      this.flags &= ~EffectFlags.ACTIVE;
    }
  }
  trigger(): void {
    if (this.flags & EffectFlags.PAUSE) {
      pausedQueueEffects.add(this);
    } else if (this.scheduler) {
      this.scheduler();
    } else {
      this.runIfDirty();
    }
  }
  /**
   * @internal
   */
  runIfDirty(): void {
    if (isDirty(this)) {
      this.run();
    }
  }

  get dirty(): boolean {
    return isDirty(this);
  }
}

/**
 * 检查订阅者 sub 的依赖项是否发生变化
 * 检查依赖项版本、刷新计算属性后的版本
 * @param sub 订阅者
 */
export function isDirty(sub: Subscriber): boolean {
  for (let link = sub.deps; link; link = link.nextDep) {
    if (
      link.dep.version !== link.version ||
      (link.dep.computed &&
        (refreshComputed(link.dep.computed) ||
          link.dep.version !== link.version))
    ) {
      return true;
    }
  }
  // @ts-expect-error only for backwards compatibility where libs manually set
  // this flag - e.g. Pinia's testing module
  if (sub._dirty) {
    return true;
  }
  return false;
}

/**
 * 批处理开始函数，记录需要批处理操作的数量
 */
export function startBatch(): void {
  batchDepth++;
}
/**
 * 批处理结束统计，开始执行已经收集到的批处理操作
 */
export function endBatch(): void {
  // 批处理所有的操作执行完毕
  if (--batchDepth > 0) return;

  let error: unknown;
  // 处理所有批处理的订阅者
  while (batchedSub) {
    let e: Subscriber | undefined = batchedSub;
    let next: Subscriber | undefined;
    // 第一次遍历：处理非活动订阅者的通知标志
    while (e) {
      if (!(e.flags & EffectFlags.ACTIVE)) {
        // 如果订阅者不活跃，清除其通知标志
        e.flags &= ~EffectFlags.NOTIFIED;
      }
      e = e.next;
    }
    e = batchedSub;
    batchedSub = undefined;
    // 第二次遍历：执行活动订阅者的操作
    while (e) {
      next = e.next;
      e.next = undefined;
      // 清除通知标志
      e.flags &= ~EffectFlags.NOTIFIED;
      if (e.flags & EffectFlags.ACTIVE) {
        try {
          // 执行活动订阅者的操作（这里被注释掉了）
          // ;(e as ReactiveEffect).trigger();
        } catch (err) {
          // 捕获并记录第一个错误
          if (!error) error = err;
        }
      }
      e = next;
    }
  }
  if (error) throw error;
}

function cleanupEffect(e: ReactiveEffect) {
  const { cleanup } = e;
  e.cleanup = undefined;
  if (cleanup) {
    const prevSub = activeSub;
    activeSub = undefined;
    try {
      cleanup();
    } finally {
      activeSub = prevSub;
    }
  }
}

/**
 * 准备订阅者 sub 的依赖项
 * 设置依赖项的版本、保存前一个活动订阅者、设置当前的活动订阅者
 * @param sub 订阅者
 *
 * @example
 * ```js
 * const sub = {
 *    deps: {
 *        version: 0,
 *        prevActiveLink: 'prevActiveLink',
 *        dep: {
 *            activeLink: 'activeLink',
 *        }
 *    },
 *    dep:{
 *    }
 * }
 * // new sub...
 * sub = {
 *    deps: {
 *        version:-1,
 *        prevActiveLink: 'activeLink',
 *        dep: {
 *            activeLink: {...sub},
 *        }
 *    }
 * }
 *
 */
function prepareDeps(sub: Subscriber) {
  for (let link = sub.deps; link; link = link.nextDep) {
    link.version = -1;
    link.prevActiveLink = link.dep.activeLink;
    link.dep.activeLink = link;
  }
}

/**
 * 清理订阅者 sub 中未使用的依赖项
 * @param sub 订阅者
 *
 * @example
 * ```js
 * const sub = {
 *    deps: 'deps',
 *    depsTail:{
 *        prevDep: 'prevDep',
 *        prevActiveLink: 'prevActiveLink',
 *        version: 0,
 *        dep: {
 *            activeLink: 'activeLink',
 *        }
 *    },
 * }
 * // new sub...
 * sub = {
 *    deps: {
 *        prevDep: 'prevDep',
 *        prevActiveLink: 'prevActiveLink',
 *        version: 0,
 *        dep: {
 *            activeLink: 'activeLink',
 *        }
 *    },
 *    depsTail: {
 *        prevDep: 'prevDep',
 *        prevActiveLink: 'prevActiveLink',
 *        version: 0,
 *        dep: {
 *            activeLink: 'activeLink',
 *        }
 *    }
 * }
 */
function cleanupDeps(sub: Subscriber) {
  let head;
  let tail = sub.depsTail;
  let link = tail;
  while (link) {
    const prev = link.prevDep;
    if (link.version === -1) {
      if (link === tail) {
        tail = prev;
      }
      removeSub(link);
      removeDep(link);
    } else {
      head = link;
    }
    link.dep.activeLink = link.prevActiveLink;
    link.prevActiveLink = undefined;
    link = prev;
  }
  sub.deps = head;
  sub.depsTail = tail;
}

function removeSub(link: Link, soft = false) {}
function removeDep(link: Link) {}

/**
 * 创建一个响应式副作用函数 effect，在响应式数据发生变化时自动执行某个函数
 * @param fn 要创建为响应式副作用函数的函数
 * @param options 创建副作用函数的选项
 *
 * @example
 * ```js
 * const count = reactive({a: 1})
 * const printCount = effect(()=>{
 *    console.log(count.a)
 * })
 * count.value = 1 // 1
 * count.value = 2 // 2
 */
export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
  const e = new ReactiveEffect(fn);
  if (options) {
    // Object.assign()
    extend(e, options);
  }
  try {
    e.run();
  } catch (err) {
    e.stop();
    throw err;
  }
  const runner = e.run.bind(e) as ReactiveEffectRunner;
  runner.effect = e;
  return runner;
}

/**
 * 刷新计算属性的值（值是否过时、计算新的值、更新计算属性的值...）
 * @param computed
 */
export function refreshComputed(computed: ComputedRefImpl): undefined {
  // 如果计算属性正在跟踪且不是脏的，则直接返回
  if (
    computed.flags & EffectFlags.TRACKING &&
    !(computed.flags & EffectFlags.DIRTY)
  ) {
    return;
  }
  // 清除脏标志
  computed.flags &= ~EffectFlags.DIRTY;
  const dep = computed.dep;
  // 设置运行标志
  computed.flags |= EffectFlags.RUNNING;
  // 保存当前的活动订阅者和跟踪状态
  const prevSub = activeSub;
  const prevShouldTrack = shouldTrack;
  // 将当前计算属性设置为活动订阅者，并启用跟踪
  activeSub = computed;
  shouldTrack = true;
  try {
    // 准备依赖项
    prepareDeps(computed);
    // 执行计算函数获取新值
    const value = computed.fn(computed._value);
    // 如果是首次计算或值发生变化，则更新计算属性的值和版本
    if (dep.version === 0 || hasChanged(value, computed._value)) {
      computed._value = value;
      dep.version++;
    }
  } catch (err) {
    // 发生错误时增加版本号并重新抛出错误
    dep.version++;
    throw err;
  } finally {
    // 恢复之前的活动订阅者和跟踪状态
    activeSub = prevSub;
    shouldTrack = prevShouldTrack;
    // 清理依赖项
    cleanupDeps(computed);
    // 清除运行标志
    computed.flags &= ~EffectFlags.RUNNING;
  }
}

export function batch(sub: Subscriber): void {
  sub.flags |= EffectFlags.NOTIFIED;
  sub.next = batchedSub;
  batchedSub = sub;
}
