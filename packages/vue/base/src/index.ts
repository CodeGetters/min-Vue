import { mountApp } from "./reactivity";
export { reactive, mountApp } from "./reactivity";
export { mount, h } from "./vdom";

export default function Vue(App, container) {
  return mountApp(App, document.querySelector(container));
}
