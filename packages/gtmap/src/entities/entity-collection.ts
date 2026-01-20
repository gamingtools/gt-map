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
}
