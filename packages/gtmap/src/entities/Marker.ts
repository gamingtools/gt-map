import type { PublicEvents } from '../api/events/public';
import type { MarkerEventMap, MarkerData } from '../api/events/maps';
import { EventedEntity } from './base';

/**
 * Options for creating or styling a Marker.
 */
export interface MarkerOptions {
  iconType?: string; // id of IconHandle, defaults to 'default'
  size?: number;
  rotation?: number; // degrees clockwise
  data?: unknown;
}

let _idSeq = 0;
function genId(): string {
  _idSeq = (_idSeq + 1) % Number.MAX_SAFE_INTEGER;
  return `m_${_idSeq.toString(36)}`;
}

/**
 * Marker - an icon anchored at a world pixel coordinate.
 *
 * Exposes typed events via `marker.events.on('click' | 'enter' | 'leave' | 'positionchange' | 'remove')`.
 */
export class Marker extends EventedEntity<MarkerEventMap> {
  readonly id: string;
  private _x: number;
  private _y: number;
  private _iconType: string;
  private _size?: number;
  private _rotation?: number;
  private _data?: unknown;
  private _onChange?: () => void;

  /**
   * Create a marker at the given pixel coordinate.
   *
   * @param x - X pixel coordinate
   * @param y - Y pixel coordinate
   * @param opts - Optional style and user data
   * @param onChange - Internal callback to notify the map facade of changes
   * @internal
   */
  constructor(x: number, y: number, opts: MarkerOptions = {}, onChange?: () => void) {
    super();
    this.id = genId();
    this._x = x;
    this._y = y;
    this._iconType = opts.iconType ?? 'default';
    this._size = opts.size;
    this._rotation = opts.rotation;
    this._data = opts.data;
    this._onChange = onChange;
  }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get iconType(): string { return this._iconType; }
  get size(): number | undefined { return this._size; }
  get rotation(): number | undefined { return this._rotation; }
  get data(): unknown { return this._data; }

  /**
   * Attach arbitrary user data to this marker.
   * Triggers a re-sync to the renderer.
   */
  setData(data: unknown): void {
    this._data = data;
    this._onChange?.();
  }

  /**
   * Update the marker style properties.
   * Triggers a re-sync to the renderer.
   */
  setStyle(opts: { iconType?: string; size?: number; rotation?: number }): void {
    if (opts.iconType !== undefined) this._iconType = opts.iconType;
    if (opts.size !== undefined) this._size = opts.size;
    if (opts.rotation !== undefined) this._rotation = opts.rotation;
    this._onChange?.();
  }

  /**
   * Move the marker to a new pixel coordinate.
   * Emits a `positionchange` event and re-syncs to the renderer.
   */
  moveTo(x: number, y: number): void {
    const dx = x - this._x;
    const dy = y - this._y;
    this._x = x;
    this._y = y;
    this.emit('positionchange', { x, y, dx, dy, marker: this.toData() });
    this._onChange?.();
  }

  /**
   * Emit a `remove` event. The owning layer clears it from the collection.
   */
  remove(): void {
    this.emit('remove', { marker: this.toData() });
  }

  /**
   * Get a snapshot of the marker for event payloads and sync.
   */
  toData(): MarkerData {
    return { id: this.id, x: this._x, y: this._y, data: this._data };
  }

  // Internal: allow map facade to forward underlying impl events
  /**
   * Forward an event from the renderer to this marker's event bus.
   * @internal
   */
  emitFromMap<K extends keyof MarkerEventMap & string>(event: K, payload: MarkerEventMap[K]): void {
    this.emit(event, payload);
  }

  // Public events surface type re-exposed for convenience
  declare readonly events: PublicEvents<MarkerEventMap>;
}
