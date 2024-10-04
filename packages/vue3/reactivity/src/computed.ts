import { isFunction } from "@mini/shared";
import { DebuggerOptions, EffectFlags, Subscriber } from "./effect";
import { Ref } from "./ref";
import { ReactiveFlags } from "./constant";

declare const ComputedRefSymbol: unique symbol;
declare const WritableComputedRefSymbol: unique symbol;
interface BaseComputedRef<T, S = T> extends Ref<T, S> {
  [ComputedRefSymbol]: true;
  /**
   * @deprecated computed no longer uses effect
   */
  effect: ComputedRefImpl;
}

export interface ComputedRef<T = any> extends BaseComputedRef<T> {
  readonly value: T;
}
export interface WritableComputedRef<T, S = T> extends BaseComputedRef<T, S> {
  [WritableComputedRefSymbol]: true;
}

export class ComputedRefImpl<T = any> implements Subscriber {
  flags: EffectFlags;
  notify(): void {}
  constructor(
    public fn: ComputedGetter<T>,
    private readonly setter: ComputedSetter<T> | undefined
  ) {
    this[ReactiveFlags.IS_READONLY] = !setter;
  }
}

export function computed<T>(
  getter: ComputedGetter<T>,
  debugOptions?: DebuggerOptions
): ComputedRef<T>;
export function computed<T, S = T>(
  options: WritableComputedOptions<T, S>,
  debugOptions?: DebuggerOptions
): WritableComputedRef<T, S>;
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>,
  debugOptions?: DebuggerOptions
) {
  let getter: ComputedGetter<T>;
  let setter: ComputedSetter<T> | undefined;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions as ComputedGetter<T>;
  } else {
    getter = (getterOrOptions as WritableComputedOptions<T>).get;
    setter = (getterOrOptions as WritableComputedOptions<T>).set;
  }
  const cRef = new ComputedRefImpl(getter, setter);
  return cRef as any;
}

export type ComputedGetter<T> = (oldValue?: T) => T;
export type ComputedSetter<T> = (newValue: T) => void;
export interface WritableComputedOptions<T, S = T> {
  get: ComputedGetter<T>;
  set: ComputedSetter<S>;
}
