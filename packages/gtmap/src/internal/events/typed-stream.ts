// Type-safe event bus with generic event map
import { EventStream, type Listener } from './stream';

/** Global debug flag for event buses - set by GTMap when debug mode enabled */
export let eventBusDebug = false;
export function setEventBusDebug(enabled: boolean): void {
	eventBusDebug = enabled;
}

export class TypedEventBus<EventMap = Record<string, unknown>> {
	private listeners = new Map<keyof EventMap, Set<Listener<unknown>>>();

	on<K extends keyof EventMap>(name: K): EventStream<EventMap[K]> {
		return new EventStream<EventMap[K]>((next) => {
			let set = this.listeners.get(name);
			if (!set) {
				set = new Set();
				this.listeners.set(name, set);
			}
			set.add(next as unknown as Listener<unknown>);
			return () => {
				set!.delete(next as unknown as Listener<unknown>);
			};
		});
	}

	emit<K extends keyof EventMap>(name: K, payload: EventMap[K]): void {
		const set = this.listeners.get(name);
		if (!set || set.size === 0) return;
		for (const fn of Array.from(set)) {
			try {
				(fn as Listener<EventMap[K]>)(payload);
			} catch (err) {
				if (eventBusDebug) console.warn(`[GTMap] Event handler error for '${String(name)}':`, err);
			}
		}
	}

	when<K extends keyof EventMap>(name: K): Promise<EventMap[K]> {
		return this.on<K>(name).first();
	}
}
