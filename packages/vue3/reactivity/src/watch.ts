import { EMPTY_OBJ } from "@mini/shared";
import { DebuggerOptions } from "./effect";
import { Ref } from "./ref";
import { ComputedRef } from "./computed";

export function watch(
  source: WatchSource | WatchSource[] | WatchEffect | object,
  cb?: WatchCallback | null,
  options: WatchOptions = EMPTY_OBJ
) {
  const { immediate, deep, once, scheduler, augmentJob, call } = options;
}

export enum WatchErrorCodes {
  WATCH_GETTER = 2,
  WATCH_CALLBACK,
  WATCH_CLEANUP,
}
export type WatchScheduler = (job: () => void, isFirstRun: boolean) => void;

export type WatchSource<T = any> = Ref<T, any> | ComputedRef<T> | (() => T);

export type WatchEffect = (onCleanup: OnCleanup) => void;

export type OnCleanup = (cleanupFn: () => void) => void;

export type WatchCallback<V = any, OV = any> = (
  value: V,
  oldValue: OV,
  onCleanup: OnCleanup
) => any;

export interface WatchOptions<Immediate = boolean> extends DebuggerOptions {
  immediate?: Immediate;
  deep?: boolean | number;
  once?: boolean;
  scheduler?: WatchScheduler;
  onWarn?: (msg: string, ...args: any[]) => void;
  /**
   * @internal
   */
  augmentJob?: (job: (...args: any[]) => void) => void;
  /**
   * @internal
   */
  call?: (
    fn: Function | Function[],
    type: WatchErrorCodes,
    args?: unknown[]
  ) => void;
}

export type WatchStopHandle = () => void;

export interface WatchHandle extends WatchStopHandle {
  pause: () => void;
  resume: () => void;
  stop: () => void;
}
