import { type Target } from "./reactive";

class BaseReactiveHandler implements ProxyHandler<Target> {}

class MutableReactiveHandler extends BaseReactiveHandler {}

export const mutableHandlers: ProxyHandler<object> =
  new MutableReactiveHandler();
