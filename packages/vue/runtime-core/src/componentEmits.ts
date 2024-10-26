import { camelize, toHandlerKey } from "@mini/shared";

export function emit(instance, event: string, ...rawArgs: any[]) {
  const props = instance.vnode.props;

  const eventName = toHandlerKey(camelize(event));

  const handler = props[eventName];

  if (handler) {
    handler(...rawArgs);
  } else {
    console.warn(`事件${eventName}不存在`);
  }
}
