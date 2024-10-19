/**
 * 创建渲染器
 * // TODO：该函数应位于 runtime-core 当中，而不是在 runtime-dom 中
 * @param {Object} options - 渲染器选项
 * @returns {Object} 返回一个包含createApp方法的对象
 */
export function createRenderer(options) {
  return {
    /**
     * 创建应用实例
     * @param {Object} rootComponent - 根组件
     * @param {Object} rootProps - 根组件的props
     * @returns {Object} 返回应用实例
     */
    createApp(rootComponent, rootProps) {
      const app = {
        mount(container) {
          // 获取到挂载所需的参数
          console.log(container, rootComponent, rootProps, options);
        },
      };
      return app;
    },
  };
}
