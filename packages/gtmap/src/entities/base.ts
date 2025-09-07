import { TypedEventBus } from '../internal/events/typed-stream';
import type { PublicEvents } from '../api/events/public';

export abstract class EventedEntity<EventMap = unknown> {
	protected readonly _bus = new TypedEventBus<EventMap>();

    readonly events: PublicEvents<EventMap> = {
        on: (event, handler?: (value: EventMap[typeof event]) => void) => {
            const stream = this._bus.on(event as keyof EventMap);
            return handler ? (stream.each as any)(handler) : (stream as any);
        },
        once: (event) => this._bus.when(event as keyof EventMap),
    } as unknown as PublicEvents<EventMap>;

	protected emit<K extends keyof EventMap & string>(event: K, payload: EventMap[K]): void {
		this._bus.emit(event, payload);
	}
}
