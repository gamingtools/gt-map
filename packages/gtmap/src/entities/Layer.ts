import { TypedEventBus } from '../internal/events/typed-stream';
import type { LayerEvents } from '../api/events/public';
import type { LayerEventMap } from '../api/events/maps';

/**
 * Options for creating a {@link Layer}.
 * 
 * @public
 */
export interface LayerOptions {
	/** 
	 * Optional custom layer ID.
	 * @defaultValue Auto-generated unique ID
	 */
	id?: string;
	
	/** 
	 * Internal callback for change notifications.
	 * @internal
	 */
	onChange?: () => void;
}

let _lidSeq = 0;
function genLayerId(): string {
	_lidSeq = (_lidSeq + 1) % Number.MAX_SAFE_INTEGER;
	return `layer_${_lidSeq.toString(36)}`;
}

/**
 * Layer - a collection of entities with lifecycle and visibility management.
 *
 * @public
 * @typeParam T - Entity type that must have an `id` property and `remove()` method
 * 
 * @remarks
 * Layers manage collections of map entities (markers, vectors) with:
 * - Automatic entity lifecycle management
 * - Visibility toggling for all entities
 * - Event emissions for entity changes
 * 
 * Events emitted via {@link Layer.events | layer.events}:
 * - `entityadd` - Entity added to layer
 * - `entityremove` - Entity removed from layer
 * - `clear` - All entities removed
 * - `visibilitychange` - Layer visibility toggled
 * 
 * @example
 * ```ts
 * // Access the default markers layer
 * const layer = map.markers;
 * 
 * // Listen for entity changes
 * layer.events.on('entityadd').each(({ entity }) => {
 *   console.log('Added:', entity.id);
 * });
 * 
 * // Toggle visibility
 * layer.setVisible(false); // Hide all markers
 * 
 * // Get all entities
 * const allMarkers = layer.getAll();
 * ```
 */
export class Layer<T extends { id: string; remove(): void }> {
	readonly id: string;
	private _eventsBus = new TypedEventBus<LayerEventMap<T>>();
	/** 
	 * Read-only typed events surface for this layer.
	 * @readonly
	 * 
	 * @example
	 * ```ts
	 * // Subscribe to entity additions
	 * layer.events.on('entityadd').each(({ entity }) => {
	 *   console.log('Added entity:', entity.id);
	 * });
	 * 
	 * // Wait for visibility change
	 * await layer.events.once('visibilitychange');
	 * ```
	 */
    readonly events: LayerEvents<T> = {
        on: (event: keyof LayerEventMap<T>, handler?: (value: LayerEventMap<T>[typeof event]) => void) => {
            const stream = this._eventsBus.on(event as keyof LayerEventMap<T>);
            return handler ? (stream.each as any)(handler) : (stream as any);
        },
        once: (event: keyof LayerEventMap<T>) => this._eventsBus.when(event as keyof LayerEventMap<T>),
	} as unknown as LayerEvents<T>;
	private _entities: Map<string, T> = new Map();
	private _visible = true;
	private _onChange?: () => void;

	/**
	 * Create a new layer.
	 *
	 * @public
	 * @param opts - Optional id and internal change hook
	 * @internal
	 */
	constructor(opts: LayerOptions = {}) {
		this.id = opts.id ?? genLayerId();
		this._onChange = opts.onChange;
	}

	/** 
	 * Add an entity to this layer.
	 * 
	 * @param entity - Entity to add
	 * @returns The added entity for chaining
	 * 
	 * @remarks
	 * Emits an `entityadd` event and triggers renderer sync.
	 * 
	 * @example
	 * ```ts
	 * // Manually add a marker to a layer
	 * const marker = new Marker(1000, 1000);
	 * layer.add(marker);
	 * ```
	 */
	add(entity: T): T {
		this._entities.set(entity.id, entity);
		this._eventsBus.emit('entityadd', { entity });
		this._onChange?.();
		return entity;
	}

	/** 
	 * Remove an entity from this layer.
	 * 
	 * @param entityOrId - Entity instance or its ID string
	 * 
	 * @remarks
	 * Emits an `entityremove` event, calls the entity's `remove()` method,
	 * and triggers renderer sync.
	 * 
	 * @example
	 * ```ts
	 * // Remove by entity reference
	 * layer.remove(marker);
	 * 
	 * // Remove by ID
	 * layer.remove('m_abc123');
	 * ```
	 */
	remove(entityOrId: T | string): void {
		const id = typeof entityOrId === 'string' ? entityOrId : entityOrId.id;
		const ent = this._entities.get(id);
		if (!ent) return;
		this._entities.delete(id);
		this._eventsBus.emit('entityremove', { entity: ent });
		ent.remove();
		this._onChange?.();
	}

	/** 
	 * Remove all entities from this layer.
	 * 
	 * @remarks
	 * Calls `remove()` on each entity, clears the collection,
	 * emits a `clear` event, and triggers renderer sync.
	 * 
	 * @example
	 * ```ts
	 * // Clear all markers
	 * map.markers.clear();
	 * 
	 * // Equivalent to map.clearMarkers()
	 * ```
	 */
	clear(): void {
		for (const ent of this._entities.values()) ent.remove();
		this._entities.clear();
		this._eventsBus.emit('clear', {});
		this._onChange?.();
	}

	/** 
	 * Set the visibility of all entities in this layer.
	 * 
	 * @param visible - `true` to show, `false` to hide
	 * 
	 * @remarks
	 * Only emits `visibilitychange` event if the visibility actually changes.
	 * Triggers renderer sync to update display.
	 * 
	 * @example
	 * ```ts
	 * // Toggle layer visibility
	 * layer.setVisible(!layer.visible);
	 * 
	 * // Hide layer temporarily
	 * layer.setVisible(false);
	 * await someAsyncOperation();
	 * layer.setVisible(true);
	 * ```
	 */
	setVisible(visible: boolean): void {
		if (this._visible === visible) return;
		this._visible = visible;
		this._eventsBus.emit('visibilitychange', { visible });
		this._onChange?.();
	}

	/** 
	 * Get an entity by its ID.
	 * 
	 * @param id - Entity ID to look up
	 * @returns The entity if found, `undefined` otherwise
	 * 
	 * @example
	 * ```ts
	 * const marker = layer.get('m_abc123');
	 * if (marker) {
	 *   marker.moveTo(2000, 1500);
	 * }
	 * ```
	 */
	get(id: string): T | undefined {
		return this._entities.get(id);
	}
	/** 
	 * Get all entities in this layer.
	 * 
	 * @returns Array snapshot of all entities
	 * 
	 * @remarks
	 * Returns a new array each call. Safe to mutate the returned array.
	 * 
	 * @example
	 * ```ts
	 * // Iterate all markers
	 * layer.getAll().forEach(marker => {
	 *   console.log(marker.x, marker.y);
	 * });
	 * 
	 * // Filter entities
	 * const nearbyMarkers = layer.getAll()
	 *   .filter(m => m.x < 2000 && m.y < 2000);
	 * ```
	 */
	getAll(): T[] {
		return Array.from(this._entities.values());
	}
	/** 
	 * Current visibility state of this layer.
	 * @readonly
	 * 
	 * @example
	 * ```ts
	 * if (layer.visible) {
	 *   console.log('Layer is currently visible');
	 * }
	 * ```
	 */
	get visible(): boolean {
		return this._visible;
	}
}
