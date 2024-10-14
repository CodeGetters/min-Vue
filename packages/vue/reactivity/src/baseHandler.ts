import { isObject } from "@mini/shared";
import { reactive, readonly } from "./reactive";
import { warn } from "./warning";
import { track } from "./deps";
import { TriggerOpTypes } from "./constant";

class BaseReactiveHandler {
  constructor(
    protected readonly _isReadonly = false,
    protected readonly _isShallow = false
  ) {}
  get(target, key: string | symbol, receiver: object): any {
    const res = Reflect.get(target, key, receiver); // target[key]
    const isReadonly = this._isReadonly,
      isShallow = this._isShallow;

    // 不是只读
    if (!isReadonly) {
      // 收集依赖
      track(target, TriggerOpTypes.SET, key);
    }

    // 判断是否是浅层响应式
    if (isShallow) {
      return res;
    }

    // 如果是一个对象，那么进行递归代理(性能优化...)
    // 另外，如果没有访问这个值，那么就不会对其进行代理
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  }
}

class MutableReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow = false) {
    super(false, isShallow);
  }
  set(target, key, value, receiver: object): boolean {
    const res = Reflect.set(target, key, value, receiver); // 获取最新值

    /**
     * ======================
     * 这里可以获取旧值来和新值进行比较，
     * 如果两值相同，那么则表明没有进行修改
     * 以此来进行性能优化
     * ======================
     */

    return res;
  }
  deleteProperty() {}
  has() {}
  ownKeys() {}
}

class ReadonlyReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow = false) {
    super(true, isShallow);
  }
  set(target: object, key: string | symbol) {
    warn("readonly 无法进行修改", target);
    return true;
  }
}

export const mutableHandlers = new MutableReactiveHandler();

export const readonlyHandlers = new ReadonlyReactiveHandler();

export const shallowReactiveHandlers = new MutableReactiveHandler(true);

export const shallowReadonlyHandlers = new ReadonlyReactiveHandler(true);
