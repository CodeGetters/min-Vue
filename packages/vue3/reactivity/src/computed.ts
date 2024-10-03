import { EffectFlags, Subscriber } from "./effect";
import { Ref } from "./ref";

declare const ComputedRefSymbol: unique symbol;

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

export class ComputedRefImpl<T = any> implements Subscriber {
  flags: EffectFlags;
  notify(): void {}
}
