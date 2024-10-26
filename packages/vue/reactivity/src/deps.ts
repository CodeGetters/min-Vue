/**
 * ====================================================================
 *
 * @file：Vue3.5 之前的响应式依赖收集track、依赖更新trigger
 *
 * 依赖收集track
 * 依赖更新trigger
 *
 * ====================================================================
 */
import { isArray, isIntegerKey } from "@mini/shared";
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
  console.log("=======track=========", target, type, key, activeEffect); // 执行 get
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
  console.log(
    "=======触发依赖更新=========",
    target,
    type,
    key,
    newValue,
    oldValue,
    targetMap.get(target)
  );
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
  /**
   * @example
   * ```js
   * const state = const reactive({ list: [0,1,2] })
   * effect(()=>{
   *    innerHTML = state[2]
   * })
   * setTimeout(()=>{
   *    // 这里修改以后 innerHTML 获取的内容应为 undefined
   *    state.length = 1
   * },1000)
   */
  if (key === "length" && isArray(target)) {
    const newLength = Number(newValue);
    depsMap.forEach((dep, key) => {
      if (key === "length" || key >= newLength) {
        // 由于这里修改了数组的长度，所以需要将所有大于等于新长度的索引对应的依赖收集都触发一遍
        console.log(
          "直接修改数组长度,需要将现在不需要的元素触发一遍",
          newValue
        );
        add(dep);
      }
    });
  } else {
    // 可能是 object
    if (key !== void 0) {
      add(depsMap.get(key));
    }
    // 可能是 array
    switch (type) {
      case TriggerOpTypes.ADD:
        if (isArray(target) && isIntegerKey(key)) {
          add(depsMap.get("length"));
        }
    }
  }
  effectSet.forEach((effect: any) => effect());
}
