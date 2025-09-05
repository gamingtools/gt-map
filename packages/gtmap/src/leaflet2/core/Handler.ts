// Minimal Leaflet-like Handler base

export abstract class Handler {
  private _enabled = false;
  enable(): this {
    if (this._enabled) return this;
    this._enabled = true;
    try { this.addHooks(); } catch {}
    return this;
  }
  disable(): this {
    if (!this._enabled) return this;
    this._enabled = false;
    try { this.removeHooks(); } catch {}
    return this;
  }
  enabled(): boolean { return this._enabled; }

  // Hooks to be implemented by subclasses
  protected addHooks(): void {}
  protected removeHooks(): void {}
}

