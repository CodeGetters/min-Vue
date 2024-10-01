/**
 * 创建映射表然后返回一个用于检查一个字符串是否在映射表中的函数
 * @param str
 * @returns
 */
export function makeMap(str: string): (key: string) => boolean {
  // 创建一个空对象作为映射表
  const map = Object.create(null);
  for (const key of str.split(",")) {
    map[key] = 1;
  }
  // 返回一个函数，用于检查给定值是否在映射表中
  return (val) => val in map;
}
