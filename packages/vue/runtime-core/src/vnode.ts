/**
 * ====================================================================
 *
 * @file vnode 虚拟节点相关操作
 *
 * 1、createVNode 函数会返回 _createVNode（源码中这里是一个三元表达式...）
 * 2、_createVNode 函数主要对 vnode 类型进行标记，同时调用 createBaseVNode
 * 3、createBaseVNode 函数主要创建 vnode 同时对所有子节点进行标记，并返回 vnode
 *
 * ====================================================================
 */
import { isArray, isFunction, isObject, isString } from "@mini/shared";
import { ShapeFlags } from "./shapeFlags";

// 创建虚拟节点：createVNode === h('div',{},[]) | h('div',{},'hello)
export const createVNode = _createVNode;

function _createVNode(
  type,
  props = null,
  children: unknown = null,
  patchFlag: number = 0,
  dynamicProps: string[] | null = null,
  isBlockNode = false
) {
  if (props) {
  }

  // 标识 vnode 的类型 --- 区分组件还是元素
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : isFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT
    : 0;

  return createBaseVNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    shapeFlag,
    isBlockNode,
    true
  );
}

function createBaseVNode(
  type,
  props = null,
  children: unknown = null,
  patchFlag: number = 0,
  dynamicProps: string[] | null = null,
  shapeFlag: number,
  isBlockNode = false,
  needFullChildrenNormalization = false
) {
  const vnode = {
    _v_isVnode: true,
    __v_skip: true,
    type,
    props,
    key: props && props.key, // key 用于 diff 算法
    el: null, // el 用于将 vnode 和真实 DOM 进行关联
    slotScopeIds: null,
    children,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag,
    dynamicChildren: null,
    appContext: null,
  };

  if (needFullChildrenNormalization) {
    normalizeChildren(vnode, children);
  } else if (children) {
  }

  return vnode;
}

function cloneVNode() {}

/**
 * 规范化子节点且设置子节点的标志位
 *
 * 这里不作太多的节点标志判断以简化函数
 *
 * @param {Object} vnode - 虚拟节点
 * @param {unknown} children - 子节点
 */
function normalizeChildren(vnode, children: unknown): void {
  let type = 0;
  if (children === null) {
    children = null;
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    type = ShapeFlags.TEXT_CHILDREN;
  }
  // 将规范化后的子节点赋值给 vnode
  vnode.children = children;
  // 等价于 vnode.shapeFlag = vnode.shapeFlag | type
  vnode.shapeFlag |= type;
}

export const Text: unique symbol = Symbol.for("v-txt");
export const Comment: unique symbol = Symbol.for("v-cmt");
export const Static: unique symbol = Symbol.for("v-stc");

/**
 * 将子节点规范化为虚拟节点
 * @param {any} child - 待规范化的子节点
 * @returns {VNode} 规范化后的虚拟节点
 */
export function normalizeVNode(child) {
  if (child == null || typeof child === "boolean") {
    // 如果子节点为 null、undefined 或布尔值，创建一个注释节点作为占位符
    return createVNode(Comment);
  } else if (isVNode(child)) {
    // 如果子节点已经是虚拟节点，直接返回
    return child;
  } else {
    // 如果子节点是其他类型（如字符串或数字），创建一个文本节点
    return createVNode(Text, null, String(child));
  }
}

export function isVNode(value: any) {
  return value ? value._v_isVnode === true : false;
}

export function isSameVNodeType(n1, n2): boolean {
  return n1.type === n2.type && n1.key === n2.key;
}
