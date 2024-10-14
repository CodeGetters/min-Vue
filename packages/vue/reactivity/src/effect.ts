import { extend } from "@mini/shared";

let activeEffect;
let uid = 0;

export class ReactiveEffect<T = any> {
  constructor(public fn: () => T) {
    // if(activeEffectScope)
  }
}

export function effect<T = any>(fn: () => T, options?) {
  const e = createReactiveEffect(fn, options);
  if (!options.lazy) {
    e();
  }
  return e;
  // const e = new ReactiveEffect(fn);
  // if (options) {
  //   extend(e, options);
  // }
}

function createReactiveEffect(fn, options) {
  const e = function reactiveEffectFn() {
    fn();
  };
  e.id = uid++;
  e._isEffect = true;
  e.raw = fn;
  e.options = options;
  return e;
}
