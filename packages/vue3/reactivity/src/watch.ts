import {
  EMPTY_OBJ,
  isArray,
  isMap,
  isObject,
  isPlainObject,
  isSet,
} from "@mini/shared";
import { DebuggerOptions, ReactiveEffect } from "./effect";
import { Ref, isRef } from "./ref";
import { ComputedRef } from "./computed";
import { isReactive, isShallow } from "./reactive";
import { ReactiveFlags } from "./constant";

let activeWatcher: ReactiveEffect | undefined = undefined;
const cleanupMap: WeakMap<ReactiveEffect, (() => void)[]> = new WeakMap();

export function watch(
  source: WatchSource | WatchSource[] | WatchEffect | object,
  cb?: WatchCallback | null,
  options: WatchOptions = EMPTY_OBJ
) {
  const { immediate, deep, once, scheduler, augmentJob, call } = options;
  const reactiveGetter = (source: object) => {
    if (deep) {
      return source;
    }
    if (isShallow(source) || deep === false || deep === 0) {
      return traverse(source, 1);
    }
    return traverse(source);
  };
  let effect: ReactiveEffect;
  let getter: () => any;
  let cleanup: (() => void) | undefined;
  let boundCleanup: typeof onWatcherCleanup;
  let forceTrigger = false;
  let isMultiSource = false;

  if (isRef(source)) {
    getter = () => source.value;
    forceTrigger = isShallow(source);
  } else if (isReactive(source)) {
    getter = () => reactiveGetter(source);
    forceTrigger = true;
  } else if (isArray(source)) {
    isMultiSource = true;
    forceTrigger = source.some((s) => isReactive(s) || isShallow(s));
    getter = () =>
      source.map((s) => {
        if (isRef(s)) {
          return s.value;
        }
      });
  }
}

export function onWatcherCleanup(
  cleanupFn: () => void,
  failSilently = false,
  owner: ReactiveEffect | undefined = activeWatcher
): void {
  if (owner) {
    let cleanups = cleanupMap.get(owner);
    if (cleanups) {
      cleanupMap.set(owner, (cleanups = []));
    }
    cleanups?.push(cleanupFn);
  }
}

export function traverse(
  value: unknown,
  depth: number = Infinity,
  seen?: Set<unknown>
): unknown {
  if (depth <= 0 || !isObject(value) || (value as any)[ReactiveFlags.SKIP]) {
    return value;
  }
  seen = seen || new Set();
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  depth--;
  if (isRef(value)) {
    traverse(value.value, depth, seen);
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], depth, seen);
    }
  } else if (isSet(value) || isMap(value)) {
    (value as Map<any, any> | Set<any>).forEach((v: any) => {
      traverse(v, depth, seen);
    });
  } else if (isPlainObject(value)) {
    for (const key in value as Record<any, any>) {
      traverse((value as Record<any, any>)[key], depth, seen);
    }
    for (const key of Object.getOwnPropertySymbols(value)) {
      if (Object.prototype.propertyIsEnumerable.call(value, key)) {
        traverse((value as Record<any, any>)[key as any], depth, seen);
      }
    }
  }
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
