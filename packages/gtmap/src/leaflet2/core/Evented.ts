// Leaflet 2.0-like Evented base (TypeScript stub)
// Public API surface only; implementations are omitted and will delegate to adapters later.

export type EventName = string;

export interface Listener<T> {
  (e: T): void;
}

export class Evented {
  on<T>(name: EventName, fn: Listener<T>, _ctx?: unknown): this {
    return this;
  }
  off<T>(name: EventName, fn?: Listener<T>, _ctx?: unknown): this {
    return this;
  }
  once<T>(name: EventName, fn: Listener<T>, _ctx?: unknown): this {
    return this;
  }
  // Non-standard helper to emit events (Leaflet uses fire)
  fire<T>(name: EventName, _data?: T): this {
    return this;
  }
}
