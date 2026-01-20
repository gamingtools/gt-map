import { TypedEventBus } from '../internal/events/typed-stream';
import type { EntityCollectionEvents } from '../api/events/public';
import type { EntityCollectionEventMap } from '../api/events/maps';

/** Options for creating an {@link EntityCollection}. */
export interface EntityCollectionOptions {
	id?: string;
	onChange?: () => void;
}

let _ecSeq = 0;
function genCollectionId(): string {
	_ecSeq = (_ecSeq + 1) % Number.MAX_SAFE_INTEGER;
	return `ec_${_ecSeq.toString(36)}`;
}

/**
 * EntityCollection<T> - a collection of entities with lifecycle and visibility.
 *
 * @public
 * @remarks
 * Emits typed events on add/remove/clear/visibility change.
 */
export class EntityCollection<T extends { id: string; _emitRemove(): void }> {
	readonly id: string;
	private _eventsBus = new TypedEventBus<EntityCollectionEventMap<T>>();
	/** Read-only typed events for this collection. */
	get events(): EntityCollectionEvents<T> {
		const bus = this._eventsBus;
		return {
			on<K extends keyof EntityCollectionEventMap<T> & string>(event: K, handler?: (value: EntityCollectionEventMap<T>[K]) => void) {
				const stream = bus.on(event);
				return handler ? stream.each(handler) : stream;
			},
			once<K extends keyof EntityCollectionEventMap<T> & string>(event: K) {
				return bus.when(event);
			},
		} as EntityCollectionEvents<T>;
	}
	private _entities: Map<string, T> = new Map();
	private _visible = true;
	private _filter: ((entity: T) => boolean) | null = null;
	private _onChange?: () => void;

	/**
	 * Create a new entity collection.
	 * @internal
	 */
	constructor(opts: EntityCollectionOptions = {}) {
		this.id = opts.id ?? genCollectionId();
		this._onChange = opts.onChange;
	}

	/** Add an entity and emit `entityadd`. */
	add(entity: T): T {
		this._entities.set(entity.id, entity);
		this._eventsBus.emit('entityadd', { entity });
		this._onChange?.();
		return entity;
	}

	/** Remove an entity (by instance or id) and emit `entityremove`. */
	remove(entityOrId: T | string): void {
		const id = typeof entityOrId === 'string' ? entityOrId : entityOrId.id;
		const ent = this._entities.get(id);
		if (!ent) return;
		this._entities.delete(id);
		this._eventsBus.emit('entityremove', { entity: ent });
		ent._emitRemove();
		this._onChange?.();
	}

	/** Remove all entities and emit `clear`. */
	clear(): void {
		for (const ent of this._entities.values()) ent._emitRemove();
		this._entities.clear();
		this._eventsBus.emit('clear', {});
		this._onChange?.();
	}

	/** Set collection visibility and emit `visibilitychange` when it changes. */
	setVisible(visible: boolean): void {
		if (this._visible === visible) return;
		this._visible = visible;
		this._eventsBus.emit('visibilitychange', { visible });
		this._onChange?.();
	}

	/** Get an entity by id. */
	get(id: string): T | undefined {
		return this._entities.get(id);
	}
	/** Get a snapshot array of all entities. */
	getAll(): T[] {
		return Array.from(this._entities.values());
	}
	/** Current visibility state. */
	get visible(): boolean {
		return this._visible;
	}

	/**
	 * Set a filter predicate to control entity visibility.
	 * Entities not matching the predicate will be hidden from rendering.
	 * Pass `null` to clear the filter and show all entities.
	 *
	 * @public
	 * @param predicate - Filter function or null to clear
	 * @returns This collection for chaining
	 * @example
	 * ```ts
	 * // Show only resources
	 * map.markers.setFilter(m => m.data.category === 'resource');
	 * // Clear filter
	 * map.markers.setFilter(null);
	 * ```
	 */
	setFilter(predicate: ((entity: T) => boolean) | null): this {
		this._filter = predicate;
		this._onChange?.();
		return this;
	}

	/** Get the current filter predicate, or null if none. */
	get filter(): ((entity: T) => boolean) | null {
		return this._filter;
	}

	/**
	 * Get entities that pass the current filter (or all if no filter).
	 * Used internally by the renderer.
	 */
	getFiltered(): T[] {
		const all = Array.from(this._entities.values());
		return this._filter ? all.filter(this._filter) : all;
	}

	/**
	 * Find entities matching a predicate.
	 *
	 * @public
	 * @param predicate - Filter function
	 * @returns Array of matching entities
	 * @example
	 * ```ts
	 * const rareItems = map.markers.find(m => m.data.tier === 'rare');
	 * ```
	 */
	find(predicate: (entity: T) => boolean): T[] {
		return Array.from(this._entities.values()).filter(predicate);
	}

	/**
	 * Count entities, optionally matching a predicate.
	 *
	 * @public
	 * @param predicate - Optional filter function
	 * @returns Count of matching entities (or total if no predicate)
	 * @example
	 * ```ts
	 * const total = map.markers.count();
	 * const resourceCount = map.markers.count(m => m.data.category === 'resource');
	 * ```
	 */
	count(predicate?: (entity: T) => boolean): number {
		if (!predicate) return this._entities.size;
		let n = 0;
		for (const ent of this._entities.values()) {
			if (predicate(ent)) n++;
		}
		return n;
	}
}
