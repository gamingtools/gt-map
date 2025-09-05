import { TypedEventBus } from '../internal/events/typed-stream';
import type { PublicEvents } from '../api/events/public';
import type { LayerEventMap } from '../api/events/maps';

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
 * Layer<T> - a collection of entities with basic lifecycle and visibility.
 *
 * Emits typed events on entity add/remove, clear, and visibility change.
 */
export class Layer<T extends { id: string; remove(): void }> {
  readonly id: string;
  private _eventsBus = new TypedEventBus<LayerEventMap<T>>();
  readonly events: PublicEvents<LayerEventMap<T>> = {
    on: (event) => this._eventsBus.on(event),
    once: (event) => this._eventsBus.when(event),
  };
  private _entities: Map<string, T> = new Map();
  private _visible = true;
  private _onChange?: () => void;

  /**
   * Create a new layer.
   * @param opts.id - Optional stable identifier
   * @param opts.onChange - Internal callback for renderer sync
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
  get(id: string): T | undefined { return this._entities.get(id); }
  /** Get a snapshot array of all entities. */
  getAll(): T[] { return Array.from(this._entities.values()); }
  /** Current visibility state. */
  get visible(): boolean { return this._visible; }
}
