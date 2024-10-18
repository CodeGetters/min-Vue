import { extend } from "@mini/shared";
import { nodeOps } from "./nodeOps";
import { patchProps } from "./patchOps";

const rendererOptions = extend({ patchProps }, nodeOps);

export { rendererOptions };
