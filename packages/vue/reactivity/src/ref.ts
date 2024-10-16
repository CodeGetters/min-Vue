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
