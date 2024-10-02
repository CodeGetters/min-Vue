import { TriggerOpTypes, type TrackOpTypes } from "./constant";

export const ITERATE_KEY: unique symbol = Symbol("");

export function track(target: object, type: TrackOpTypes, key: unknown): void {}

export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>
): void {}
