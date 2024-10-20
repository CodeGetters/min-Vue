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
import { patchDOMProps } from "./modules/props";
import { isOn } from "@mini/shared";

export const patchProp = (el, key, prevKey, nextValue) => {
  switch (key) {
    case "class":
      patchClass(el, nextValue);
      break;
    case "style":
      patchStyle(el, prevKey, nextValue);
      break;
    default:
      if (isOn(key)) {
        patchEvent(el, key, nextValue);
      } else {
        patchAttr(el, key, nextValue);
      }
  }
};
