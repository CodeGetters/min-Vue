/**
 * ====================================================================
 *
 * @file ：ref 的实现
 * ref、shallowRef 的实现区别在于 shallow，所以两个函数可以基于同一个函数实现（第二个参数区分）
 * 它们都使用 createRef 函数实现，而它是使用 RefImpl 类实现的
 *     a.RefImpl 类构造函数接受两个参数，一个是 value，一个是 isShallow
 *     b.构造函数接收到参数后将其赋值给 _value
 *     c.RefImpl 响应式实现原理是通过 get 操作去收集依赖 track，set 操作去触发更新 trigger
 *
 * ====================================================================
 */
import { hasChanged } from "@mini/shared";
import { ReactiveFlags, TrackOpTypes, TriggerOpTypes } from "./constant";
import { track, trigger } from "./deps";

export function ref(value?: unknown) {
  return createRef(value, false);
}

export function shallowRef(value?: unknown) {
  return createRef(value, true);
}

function createRef(rawValue: unknown, isShallow: boolean) {
  return new RefImpl(rawValue, isShallow);
}

class RefImpl<T = any> {
  _value: T;
  private _rawValue;
  constructor(value: T, isShallow: boolean) {
    this._value = value;
    this[ReactiveFlags.IS_SHALLOW] = isShallow;
  }
  get value() {
    // 收集依赖 track
    track(this, TrackOpTypes.GET, "value");
    return this._value;
  }
  set value(newValue) {
    // 触发更新 trigger
    if (hasChanged(newValue, this._value)) {
      this._value = newValue;
      trigger(this, TriggerOpTypes.SET, "value", newValue);
    }
  }
}
