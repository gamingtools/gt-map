import { TypedEventBus } from '../internal/events/typed-stream';
import type { PublicEvents } from '../api/events/public';

export abstract class EventedEntity<EventMap extends Record<string, unknown>> {
  protected readonly _bus = new TypedEventBus<EventMap>();

  readonly events: PublicEvents<EventMap> = {
    on: (event) => this._bus.on(event),
    once: (event) => this._bus.when(event),
  };

  protected emit<K extends keyof EventMap & string>(event: K, payload: EventMap[K]): void {
    this._bus.emit(event, payload);
  }
}
