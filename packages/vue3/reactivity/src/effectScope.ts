import { ReactiveEffect } from "./effect";

export let activeEffectScope: EffectScope | undefined;

export class EffectScope {
  private _active = true;
  effects: ReactiveEffect[] = [];
  get active(): boolean {
    return this._active;
  }
}
