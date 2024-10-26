// contexts where user provided function may be executed, in addition to

import { isFunction, isPromise } from "@mini/shared";

// lifecycle hooks.
export enum ErrorCodes {
  SETUP_FUNCTION,
  RENDER_FUNCTION,
  // The error codes for the watch have been transferred to the reactivity
  // package along with baseWatch to maintain code compatibility. Hence,
  // it is essential to keep these values unchanged.
  // WATCH_GETTER,
  // WATCH_CALLBACK,
  // WATCH_CLEANUP,
  NATIVE_EVENT_HANDLER = 5,
  COMPONENT_EVENT_HANDLER,
  VNODE_HOOK,
  DIRECTIVE_HOOK,
  TRANSITION_HOOK,
  APP_ERROR_HANDLER,
  APP_WARN_HANDLER,
  FUNCTION_REF,
  ASYNC_COMPONENT_LOADER,
  SCHEDULER,
  COMPONENT_UPDATE,
  APP_UNMOUNT_CLEANUP,
}
export function callWithAsyncErrorHandling(
  fn,
  instance,
  type,
  args?: unknown[]
) {
  if (isFunction(fn)) {
    const res = callWithErrorHandling(fn, instance, type, args);
    if (res && isPromise(res)) {
      res.catch((err) => {
        console.log("============callWithAsyncErrorHandling=========", err);
      });
      return res;
    }
  }
}

export function callWithErrorHandling(fn, instance, type, args?: unknown[]) {
  try {
    return args ? fn(...args) : fn();
  } catch (err) {
    console.error("========callWithErrorHandling============", err);
  }
}
