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
	 * Subscribe to a named event with an inline handler.
	 *
	 * @param event - Event name (typed)
	 * @param handler - Handler invoked synchronously with the event payload
	 * @returns An `Unsubscribe` function
	 *
	 * @example
	 * marker.events.on('click', (e) => {
	 *   console.log('clicked at', e.x, e.y);
	 * });
	 */
	on<K extends keyof EventMap & string>(event: K, handler: (value: EventMap[K]) => void): Unsubscribe;
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

// Typed event surfaces for better IntelliSense on hover
// These extend PublicEvents but annotate common names for quick reference.

import type { EventMap as MapEventMap } from '../types';

import type { MarkerEventMap, VectorEventMap, LayerEventMap } from './maps';

/** Marker events surface with typed names and payloads. */
export interface MarkerEvents<T = unknown> extends PublicEvents<MarkerEventMap<T>> {
	/**
	 * Subscribe to a marker event.
	 *
	 * Supported names: 'click' | 'tap' | 'longpress' | 'pointerdown' | 'pointerup' | 'pointerenter' | 'pointerleave' | 'positionchange' | 'remove'
	 */
	on<K extends keyof MarkerEventMap<T> & string>(event: K): EventSubscription<MarkerEventMap<T>[K]>;
	on<K extends keyof MarkerEventMap<T> & string>(event: K, handler: (value: MarkerEventMap<T>[K]) => void): Unsubscribe;
}

/** Vector events surface with typed names and payloads. */
export interface VectorEvents extends PublicEvents<VectorEventMap> {
	/** Supported names: 'remove' */
	on<K extends keyof VectorEventMap & string>(event: K): EventSubscription<VectorEventMap[K]>;
	on<K extends keyof VectorEventMap & string>(event: K, handler: (value: VectorEventMap[K]) => void): Unsubscribe;
}

/** Layer events surface with typed names and payloads. */
export interface LayerEvents<T> extends PublicEvents<LayerEventMap<T>> {
	/** Supported names: 'entityadd' | 'entityremove' | 'clear' | 'visibilitychange' */
	on<K extends keyof LayerEventMap<T> & string>(event: K): EventSubscription<LayerEventMap<T>[K]>;
	on<K extends keyof LayerEventMap<T> & string>(event: K, handler: (value: LayerEventMap<T>[K]) => void): Unsubscribe;
}

/** Map events surface with typed names and payloads. */
export interface MapEvents<T = unknown> extends PublicEvents<MapEventMap<T>> {
	/**
	 * Subscribe to a map event.
	 *
	 * Common names: 'load' | 'resize' | 'move' | 'moveend' | 'zoom' | 'zoomend' | 'pointerdown' | 'pointermove' | 'pointerup' | 'mousedown' | 'mousemove' | 'mouseup' | 'click' | 'dblclick' | 'contextmenu' | 'frame' | 'markerenter' | 'markerleave' | 'markerclick' | 'markerdown' | 'markerup' | 'markerlongpress'
	 */
	on<K extends keyof MapEventMap<T> & string>(event: K): EventSubscription<MapEventMap<T>[K]>;
	on<K extends keyof MapEventMap<T> & string>(event: K, handler: (value: MapEventMap<T>[K]) => void): Unsubscribe;
}
