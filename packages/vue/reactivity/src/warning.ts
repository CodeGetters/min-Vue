export function warn(msg: string, ...args: any[]): void {
  console.warn(`[libreactive warn] ${msg}`, ...args);
}
