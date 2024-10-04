import { isFunction } from "@mini/shared";
import {
  DebuggerOptions,
  EffectFlags,
  Subscriber,
  refreshComputed,
} from "./effect";
import { Ref } from "./ref";
import { ReactiveFlags } from "./constant";
import { Dep, Link } from "./dep";

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
  _value: any = undefined;
  readonly dep: Dep = new Dep(this);
  deps?: Link = undefined;
  flags: EffectFlags;
  notify(): true | void {}
  constructor(
    public fn: ComputedGetter<T>,
    private readonly setter: ComputedSetter<T> | undefined
  ) {
    this[ReactiveFlags.IS_READONLY] = !setter;
  }

  get value(): T {
    const link = this.dep.track();
    refreshComputed(this);
    if (link) {
      link.version = this.dep.version;
    }
    return this._value;
  }

  set value(newValue) {
    if (this.setter) {
      this.setter(newValue);
    }
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
  let getter: ComputedGetter<T>, setter: ComputedSetter<T> | undefined;
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
