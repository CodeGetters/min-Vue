import { shallowReactive } from "@mini/reactivity";
import { type Data } from "./renderer";

export function initProps(instance, rawProps: Data | null, isStateful: number) {
  const props: Data = {};

  instance.propsDefaults = Object.create(null);
  if (isStateful) {
    instance.props = shallowReactive(props);
  } else {
    if (!instance.type.props) {
      // instance.props=attrs
    } else {
      instance.props = props;
    }
  }
}

export function normalizePropsOptions(comp, appContext, asMixin = false) {
  const normalized = {};
  const needCastKeys = [];
  const res = [normalized, needCastKeys];
  return res;
}
