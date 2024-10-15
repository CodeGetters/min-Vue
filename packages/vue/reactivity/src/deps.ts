import { TriggerOpTypes } from "./constant";
import { activeEffect } from "./effect";

const targetMap = new WeakMap();

/**
 * 依赖收集
 * @param target
 * @param type
 * @param key
 * @returns
 */
export function track(target, type, key) {
  // console.log("=======track=========", target, type, key, activeEffect); // 执行 get
  if (activeEffect === undefined) return;
  let depMap = targetMap.get(target);
  if (!depMap) {
    targetMap.set(target, (depMap = new Map()));
  }
  let dep = depMap.get(key);
  if (!dep) {
    depMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
  }
  // console.log("target", targetMap);
}

export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>
) {
  // console.log("=======触发更新=========", target, type, key, newValue, oldValue)
  console.log("target", targetMap.get(target));
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  // let effects = depsMap.get(key);
  const effectSet = new Set();

  const add = (effectsAdd) => {
    if (effectsAdd) {
      effectsAdd.forEach((effect) => effectSet.add(effect));
    }
  };
  add(depsMap.get(key));
  effectSet.forEach((effect: any) => effect());
}
