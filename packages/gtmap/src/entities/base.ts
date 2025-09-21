import { TypedEventBus } from '../internal/events/typed-stream';
import type { PublicEvents } from '../api/events/public';

export abstract class EventedEntity<EventMap = Record<string, unknown>> {
  protected readonly _bus = new TypedEventBus<EventMap>();

  get events(): PublicEvents<EventMap> {
    const bus = this._bus;
    return {
      on<K extends keyof EventMap & string>(event: K, handler?: (value: EventMap[K]) => void) {
        const stream = bus.on(event);
        return handler ? stream.each(handler) : stream;
      },
      once<K extends keyof EventMap & string>(event: K) {
        return bus.when(event);
      },
    } as PublicEvents<EventMap>;
  }

  protected emit<K extends keyof EventMap & string>(event: K, payload: EventMap[K]): void {
    this._bus.emit(event, payload);
  }
}
