// Type-safe event bus with generic event map
import { EventStream, type Listener, type Unsubscribe } from './stream';

export class TypedEventBus<EventMap extends Record<string, any> = Record<string, any>> {
	private listeners = new Map<keyof EventMap, Set<Listener<any>>>();

	on<K extends keyof EventMap>(name: K): EventStream<EventMap[K]> {
		return new EventStream<EventMap[K]>((next) => {
			let set = this.listeners.get(name);
			if (!set) {
				set = new Set();
				this.listeners.set(name, set);
			}
			set.add(next as Listener<any>);
			return () => {
				set!.delete(next as Listener<any>);
			};
		});
	}

	emit<K extends keyof EventMap>(name: K, payload: EventMap[K]): void {
		const set = this.listeners.get(name);
		if (!set || set.size === 0) return;
		for (const fn of Array.from(set)) {
			try {
				(fn as Listener<EventMap[K]>)(payload);
			} catch {}
		}
	}

	when<K extends keyof EventMap>(name: K): Promise<EventMap[K]> {
		return this.on<K>(name).first();
	}

	// Legacy compatibility methods
	addListener<K extends keyof EventMap>(name: K, handler: (data: EventMap[K]) => void): Unsubscribe {
		return this.on(name).each(handler);
	}

	removeListener<K extends keyof EventMap>(_name: K, _handler: (data: EventMap[K]) => void): void {
		// Note: This doesn't actually remove the specific handler due to stream API design
		// but is provided for compatibility
	}

	// Alias for backward compatibility
	stream<K extends keyof EventMap>(name: K): EventStream<EventMap[K]> {
		return this.on(name);
	}
}