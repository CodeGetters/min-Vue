/**
 * ====================================================================
 *
 * @file 属性操作
 *
 * 比对新旧 DOM 上的属性值，并进行更新
 *
 * 对于节点上的属性操作，主要包括：
 *   1. class
 *   2. style
 *   3. attrs
 *   4. events
 *   5. props
 * 这几个操作相关内容也在 modules/ 目录下一一对应
 *
 * ====================================================================
 */
import { patchClass } from "./modules/class";
import { patchStyle } from "./modules/style";
import { patchAttr } from "./modules/attrs";
import { patchEvent } from "./modules/events";
import { patchDOMProp } from "./modules/props";
import { isOn, isString } from "@mini/shared";

export const patchProp = (el, key, prevKey, nextValue) => {
  console.log("===================patchProp==============", key);
  switch (key) {
    case "class":
      patchClass(el, nextValue);
      break;
    case "style":
      patchStyle(el, prevKey, nextValue);
      break;
    case isOn(key):
      patchEvent(el, key, nextValue);
      break;
    default:
      if (
        key[0] === "."
          ? ((key = key.slice(1)), true)
          : key[0] === "^"
          ? ((key = key.slice(1)), false)
          : shouldSetAsProp(el, key, nextValue)
      ) {
        patchDOMProp(el, key, nextValue);
      } else {
        patchAttr(el, key, nextValue);
      }
  }
};

function shouldSetAsProp(el, key, value) {
  if (isNativeOn(key) && isString(value)) {
    return false;
  }
  return key in el;
}

const isNativeOn = (key: string) =>
  key.charCodeAt(0) === 111 /* o */ &&
  key.charCodeAt(1) === 110 /* n */ &&
  // lowercase letter
  key.charCodeAt(2) > 96 &&
  key.charCodeAt(2) < 123;
