import { TypedEventBus } from '../internal/events/typed-stream';
import type { PublicEvents } from '../api/events/public';
import type { LayerEventMap } from '../api/events/maps';

/** Options for creating a {@link Layer}. */
export interface LayerOptions {
	id?: string;
	onChange?: () => void;
}

let _lidSeq = 0;
function genLayerId(): string {
	_lidSeq = (_lidSeq + 1) % Number.MAX_SAFE_INTEGER;
	return `layer_${_lidSeq.toString(36)}`;
}

/**
 * Layer<T> - a collection of entities with lifecycle and visibility.
 *
 * @public
 * @remarks
 * Emits typed events on add/remove/clear/visibility change.
 */
export class Layer<T extends { id: string; remove(): void }> {
	readonly id: string;
	private _eventsBus = new TypedEventBus<LayerEventMap<T>>();
	/** Read‑only typed events for this layer. */
    readonly events: PublicEvents<LayerEventMap<T>> = {
        on: (event: any, handler?: any) => {
            const stream = this._eventsBus.on(event);
            return handler ? stream.each(handler) : stream;
        },
        once: (event: any) => this._eventsBus.when(event),
    } as PublicEvents<LayerEventMap<T>>;
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
		ent.remove();
		this._onChange?.();
	}

	/** Remove all entities and emit `clear`. */
	clear(): void {
		for (const ent of this._entities.values()) ent.remove();
		this._entities.clear();
		this._eventsBus.emit('clear', {});
		this._onChange?.();
	}

	/** Set layer visibility and emit `visibilitychange` when it changes. */
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
