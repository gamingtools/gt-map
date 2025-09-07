import { TypedEventBus } from '../internal/events/typed-stream';
import type { PublicEvents } from '../api/events/public';

export abstract class EventedEntity<EventMap = any> {
	protected readonly _bus = new TypedEventBus<EventMap>();

    readonly events: PublicEvents<EventMap> = {
        on: (event: any, handler?: any) => {
            const stream = this._bus.on(event);
            return handler ? stream.each(handler) : stream;
        },
        once: (event: any) => this._bus.when(event),
    } as PublicEvents<EventMap>;

	protected emit<K extends keyof EventMap & string>(event: K, payload: EventMap[K]): void {
		this._bus.emit(event, payload);
	}
}
