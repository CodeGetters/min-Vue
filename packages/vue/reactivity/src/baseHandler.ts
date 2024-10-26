/**
 * ====================================================================
 *
 * @file: 响应式处理器
 *
 * 1、响应式数据被分为四类：reactive、readonly、shallowReactive、shallowReadonly
 * 2、但其实他们的逻辑都差不多，所以最后将其分为两类：【reactive】、【readonly】
 * 3、故 reactive、shallowReactive 和 shallowReactive、shallowReadonly 都使用了相同的 handler 类
 * 4、在 BaseReactiveHandler 类中进行扩展出了一个【只读】的 handler 类和一个【可读】的 handler
 * 5、在 BaseReactiveHandler 类中的构造函数中有一个 isReadonly 和 isShallow 的属性
 *    a.MutableReactiveHandler 构造函数中 isReadonly 为 false
 *    b.ReadonlyReactiveHandler 构造函数中 isReadonly 为 true
 * 6、在处理响应式数据的 get 操作时，需要进行判读那是否是【isReadonly】、【isShallow】、【isObject】
 *    a.如果是【isReadonly】，那么直接返回，不是的话则需要进行【收集依赖】（track）
 *    b.如果是【isShallow】，那么直接返回
 *    c.如果是【isObject】，那么进行递归代理(性能优化...)。
 * 7、Proxy 实现的代理都有【懒代理】的性质，即只有在对应的属性被访问时才会进行代理，比Vue2的响应式数据性能要好
 * ====================================================================
 */
import {
  hasChanged,
  hasOwn,
  isArray,
  isIntegerKey,
  isObject,
} from "@mini/shared";
import { reactive, readonly } from "./reactive";
import { warn } from "./warning";
import { track, trigger } from "./deps";
import { ReactiveFlags, TriggerOpTypes } from "./constant";

class BaseReactiveHandler {
  constructor(
    protected readonly _isReadonly = false,
    protected readonly _isShallow = false
  ) {}
  get(target, key: string | symbol, receiver: object): any {
    const isReadonly = this._isReadonly,
      isShallow = this._isShallow;

    switch (key) {
      case ReactiveFlags.IS_REACTIVE:
        return !isReadonly;
      case ReactiveFlags.IS_READONLY:
        return isReadonly;
      case ReactiveFlags.IS_SHALLOW:
        return isShallow;
      // case ReactiveFlags.RAW:
    }

    const res = Reflect.get(target, key, receiver); // target[key]

    if (!isReadonly) {
      track(target, TriggerOpTypes.SET, key);
    }

    if (isShallow) {
      return res;
    }

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
    const oldValue = target[value];

    // const [1,2,3,4] 处理 count[5] 这样的情况
    const hadKey =
      isArray(oldValue) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key);

    const res = Reflect.set(target, key, value, receiver); // 获取最新值
    if (!hadKey) {
      // 原 object 中没有这个属性，增加...
      trigger(target, TriggerOpTypes.ADD, key, res);
    } else {
      // 原 object 中存在这个属性，修改...
      if (hasChanged(res, oldValue))
        trigger(target, TriggerOpTypes.SET, key, res, oldValue);
    }

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
