import { mount, patch } from "./vdom";

let activeEffect;

class Dep {
  subscribers = new Set();
  depend() {
    if (activeEffect) {
      this.subscribers.add(activeEffect);
    }
  }

  notify() {
    this.subscribers.forEach((effect) => {
      effect();
    });
  }
}

function watchEffect(effect) {
  activeEffect = effect;
  effect();
  activeEffect = null;
}

function reactive(raw) {
  return new Proxy(raw, reactiveHandlers);
}

const targetMap = new WeakMap();

function getDep(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Dep();
    depsMap.set(key, dep);
  }
  return dep;
}

const reactiveHandlers = {
  get(target, key, receiver) {
    const dep = getDep(target, key);
    dep.depend();
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    const dep = getDep(target, key);
    const result = Reflect.set(target, key, value, receiver);
    dep.notify();
    return result;
  },
  has() {},
  ownKeys() {},
};

function mountApp(component, container) {
  let isMounted = false;
  let prevDom;
  watchEffect(() => {
    if (!isMounted) {
      prevDom = component.render();
      mount(prevDom, container);
      isMounted = true;
    } else {
      const newVdom = component.render();
      patch(prevDom, newVdom);
      prevDom = newVdom;
    }
  });
}

export { reactive, mountApp };
