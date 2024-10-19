/**
 * ====================================================================
 *
 * @file shapeFlags
 *
 * 使用二进制来表示 vnode 的类型，以便在 diff 算法中进行快速判断
 * 一个字符有 8 位，左移超出 8 位后，会在后面补 0
 * eg：1 << 20 --> 0b00000001_00000000_00000000_00000000
 *
 * 1--> 0b00000001
 * 1 << 1 --> 0b00000010 --> 1*2^1
 * 1 << 2 --> 0b00000100 --> 1*2^2
 * 1 << 3 --> 0b00001000 --> 1*2^3
 * 1 << 4 --> 0b00010000 --> 1*2^4
 * 1 << 5 --> 0b00100000 --> 1*2^5
 * 1 << 6 --> 0b01000000 --> 1*2^6
 * 1 << 7 --> 0b10000000 --> 1*2^7
 * 1 << 8 --> 0b00000001_00000000 --> 1*2^8
 * 1 << 9 --> 0b00000010_00000000 --> 1*2^9
 *
 * 注意：
 * COMPONENT 使用了 |，那么 1 << 2 | 1 << 3 --> 0b00000110 --> 6
 * 所以判断是否时为 COMPONENT 时，需要使用 & 来判断
 * ```js
 * // 判断是否为 COMPONENT
 * if (shapeFlag & ShapeFlags.COMPONENT) {
 *   // 是 COMPONENT
 * }
 * ```
 * ====================================================================
 */
export enum ShapeFlags {
  ELEMENT = 1,
  FUNCTIONAL_COMPONENT = 1 << 1,
  STATEFUL_COMPONENT = 1 << 2,
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}
