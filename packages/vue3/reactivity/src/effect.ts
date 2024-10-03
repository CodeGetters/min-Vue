import { Link } from "./dep";

let batchDepth = 0;
let batchedSub: Subscriber | undefined;

export enum EffectFlags {
  ACTIVE = 1 << 0,
  RUNNING = 1 << 1,
  TRACKING = 1 << 2,
  NOTIFIED = 1 << 3,
  DIRTY = 1 << 4,
  ALLOW_RECURSE = 1 << 5,
  PAUSE = 1 << 6,
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

export interface ReactiveEffectOptions extends DebuggerOptions {}

// export class ReactiveEffect<T =any> implements Subscriber , ReactiveEffectOptions{
//   deps?: Link = undefined
//   depsTail?: Link | undefined;
//   flags: EffectFlags=EffectFlags.ACTIVE|EffectFlags.TRACKING;
//   next?: Subscriber | undefined;
//   cleanup?:()=>void=undefined
// }

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
