export function callWithErrorHandling(
  fn: Function,
  instance,
  args?: unknown[]
) {
  try {
    return args ? fn(...args) : fn();
  } catch (error) {
    console.log("callWithErrorHandling", instance);
  }
}
