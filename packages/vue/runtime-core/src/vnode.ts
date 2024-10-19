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
