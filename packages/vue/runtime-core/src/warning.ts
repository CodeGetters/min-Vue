export function warn(msg: string, ...args: any[]): void {
  console.warn(`[libRuntimeCore warn] ${msg}`, ...args);
}
