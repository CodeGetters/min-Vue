import { hasChanged } from "@mini/shared";
import { ReactiveFlags } from "./constant";
import { Dep } from "./dep";
import { Builtin, ShallowReactiveMarker, toReactive } from "./reactive";
import { IfAny } from "./typeUtils";

export function ref<T>(
  value: T
): [T] extends [Ref]
  ? IfAny<T, Ref<T>, T>
  : Ref<UnwrapRef<T>, UnwrapRef<T> | T>;
export function ref<T = any>(): Ref<T | undefined>;
export function ref(value?: unknown) {
  return createRef(value, false);
}

/**
 * 创建响应式引用对象
 * @internal
 * @param rawValue 响应式引用对象的值
 * @param shallow 浅代理？
 */
function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}

class RefImpl<T = any> {
  _value: T; // 响应式引用对象的值
  private _rawValue: T; // 响应式引用对象的原始值
  dep: Dep = new Dep(); // 响应式引用对象的依赖管理对象
  public readonly [ReactiveFlags.IS_REF] = true;
  public readonly [ReactiveFlags.IS_SHALLOW]: boolean = false;

  constructor(value: T, isShallow: boolean) {
    this._rawValue = value;
    this._value = isShallow ? value : toReactive(value);
  }

  /**
   * @internal
   * 获取响应式引用对象的值
   */
  get value() {
    // 收集依赖
    this.dep.track();
    return this._value;
  }
  /**
   * @internal
   * 设置响应式引用对象的值
   * 判断新值和旧值是否，不同则更新响应式引用对象的值
   */
  set value(newValue) {
    const oldValue = this._rawValue;
    if (hasChanged(newValue, oldValue)) {
      this._rawValue = newValue;
      this._value = newValue;
      this.dep.trigger();
    }
  }
}
declare const RefSymbol: unique symbol;

export interface Ref<T = any, S = T> {
  get value(): T;
  set value(_: S);
  [RefSymbol]: true;
}

export function isRef<T>(r: Ref<T> | unknown): r is Ref<T>;
export function isRef(r: any): r is Ref {
  return r ? r[ReactiveFlags.IS_REF] === true : false;
}

export type ShallowUnwrapRef<T> = {
  [K in keyof T]: DistributeRef<T[K]>;
};

type DistributeRef<T> = T extends Ref<infer V> ? V : T;

export type UnwrapRef<T> = T extends ShallowRef<infer V, infer _>
  ? V
  : T extends Ref<infer V, infer _>
  ? UnwrapRefSimple<V>
  : UnwrapRefSimple<T>;

declare const ShallowRefMarker: unique symbol;
export type ShallowRef<T = any, S = T> = Ref<T, S> & {
  [ShallowRefMarker]?: true;
};
export interface RefUnwrapBailTypes {}
export declare const RawSymbol: unique symbol;

export type UnwrapRefSimple<T> = T extends
  | Builtin
  | Ref
  | RefUnwrapBailTypes[keyof RefUnwrapBailTypes]
  | { [RawSymbol]?: true }
  ? T
  : T extends Map<infer K, infer V>
  ? Map<K, UnwrapRefSimple<V>> & UnwrapRef<Omit<T, keyof Map<any, any>>>
  : T extends WeakMap<infer K, infer V>
  ? WeakMap<K, UnwrapRefSimple<V>> & UnwrapRef<Omit<T, keyof WeakMap<any, any>>>
  : T extends Set<infer V>
  ? Set<UnwrapRefSimple<V>> & UnwrapRef<Omit<T, keyof Set<any>>>
  : T extends WeakSet<infer V>
  ? WeakSet<UnwrapRefSimple<V>> & UnwrapRef<Omit<T, keyof WeakSet<any>>>
  : T extends ReadonlyArray<any>
  ? { [K in keyof T]: UnwrapRefSimple<T[K]> }
  : T extends object & { [ShallowReactiveMarker]?: never }
  ? {
      [P in keyof T]: P extends symbol ? T[P] : UnwrapRef<T[P]>;
    }
  : T;
