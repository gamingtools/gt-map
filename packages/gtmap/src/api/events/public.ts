/** Function that unsubscribes a previously registered handler. */
export type Unsubscribe = () => void;

/** Minimal subscription interface exposed publicly. */
export interface EventSubscription<T> {
	/** Register a handler and receive an `Unsubscribe` function. */
	each(handler: (value: T) => void): Unsubscribe;
}

/**
 * Public read-only events surface for entities and map.
 *
 * Provides typed subscriptions via `on(event)` and one-shot via `once(event)`.
 * Handlers run synchronously in emit order. Each subscription returns an
 * `Unsubscribe` function via `stream.each(handler)`.
 */
export interface PublicEvents<EventMap> {
	/**
	 * Subscribe to a named event.
	 *
	 * @param event - Event name (typed by the entity's event map)
	 * @returns An `EventStream<Payload>` with `.each(handler)` to subscribe.
	 *
	 * @example
	 * marker.events.on('click').each((e) => {
	 *   console.log('clicked at', e.x, e.y);
	 * });
	 */
	on<K extends keyof EventMap & string>(event: K): EventSubscription<EventMap[K]>;
	/**
	 * Wait for the next event occurrence and resolve with its payload.
	 *
	 * @param event - Event name (typed)
	 * @returns Promise that resolves with the payload of the next event.
	 *
	 * @example
	 * await marker.events.once('remove');
	 */
	once<K extends keyof EventMap & string>(event: K): Promise<EventMap[K]>;
}
