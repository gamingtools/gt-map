/**
 * LayerRegistry -- manages z-ordered collection of layers.
 */
import type { TileLayer } from '../../api/layers/tile-layer';
import type { InteractiveLayer } from '../../api/layers/interactive-layer';
import type { StaticLayer } from '../../api/layers/static-layer';
import type { LayerState } from '../../api/layers/types';
import type { SharedRenderCtx } from '../types';

export type AnyLayer = TileLayer | InteractiveLayer | StaticLayer;

/** Per-layer renderer handle (set by the rendering system when GL is ready). */
export interface LayerRendererHandle {
  render(sharedCtx: SharedRenderCtx, opacity: number): void;
  dispose(): void;
  rebuild?(gl: WebGLRenderingContext): void;
  resize?(w: number, h: number): void;
  /** For tile layers: clear wanted set each frame. */
  clearWanted?(): void;
  /** For tile layers: cancel unwanted tile requests. */
  cancelUnwanted?(): void;
  /** For static layers: rasterize vectors to canvas and upload texture. */
  prepareFrame?(): void;
  /** For interactive layers: build alpha masks after rendering. */
  requestMaskBuild?(): void;
  /** For tile layers: whether tiles are idle. */
  isIdle?(): boolean;
  /** For tile layers: set frame counter. */
  setFrame?(f: number): void;
}

export interface LayerEntry {
  layer: AnyLayer;
  state: LayerState;
  renderer: LayerRendererHandle | null;
}

export class LayerRegistry {
  private _entries = new Map<string, LayerEntry>();
  private _sorted: LayerEntry[] | null = null;
  private _interactiveSorted: LayerEntry[] | null = null;

  add(layer: AnyLayer, state: LayerState): void {
    this._entries.set(layer.id, { layer, state, renderer: null });
    this._invalidateSort();
  }

  remove(layerId: string): LayerEntry | undefined {
    const entry = this._entries.get(layerId);
    if (!entry) return undefined;
    this._entries.delete(layerId);
    this._invalidateSort();
    return entry;
  }

  get(layerId: string): LayerEntry | undefined {
    return this._entries.get(layerId);
  }

  has(layerId: string): boolean {
    return this._entries.has(layerId);
  }

  /** Get all entries sorted by z-order (ascending). */
  getSorted(): readonly LayerEntry[] {
    if (!this._sorted) {
      this._sorted = Array.from(this._entries.values()).sort((a, b) => a.state.z - b.state.z);
    }
    return this._sorted;
  }

  /** Get interactive layer entries sorted by z-order descending (for hit testing). */
  getInteractiveSortedReverse(): readonly LayerEntry[] {
    if (!this._interactiveSorted) {
      this._interactiveSorted = Array.from(this._entries.values())
        .filter((e) => e.layer.type === 'interactive')
        .sort((a, b) => b.state.z - a.state.z);
    }
    return this._interactiveSorted;
  }

  /** Update z-order for a layer. */
  setZ(layerId: string, z: number): void {
    const entry = this._entries.get(layerId);
    if (entry) {
      entry.state.z = z;
      this._invalidateSort();
    }
  }

  /** Update visibility for a layer. */
  setVisible(layerId: string, visible: boolean): void {
    const entry = this._entries.get(layerId);
    if (entry) entry.state.visible = visible;
  }

  /** Update opacity for a layer. */
  setOpacity(layerId: string, opacity: number): void {
    const entry = this._entries.get(layerId);
    if (entry) entry.state.opacity = Math.max(0, Math.min(1, opacity));
  }

  /** Set the renderer handle for a layer. */
  setRenderer(layerId: string, renderer: LayerRendererHandle): void {
    const entry = this._entries.get(layerId);
    if (entry) entry.renderer = renderer;
  }

  /** Get all entries (unordered). */
  entries(): IterableIterator<LayerEntry> {
    return this._entries.values();
  }

  /** Get count of registered layers. */
  get size(): number {
    return this._entries.size;
  }

  /** Dispose all layer renderers and clear the registry. */
  destroyAll(): void {
    for (const entry of this._entries.values()) {
      try {
        entry.renderer?.dispose();
      } catch {
        /* expected: renderer may already be disposed */
      }
    }
    this._entries.clear();
    this._invalidateSort();
  }

  private _invalidateSort(): void {
    this._sorted = null;
    this._interactiveSorted = null;
  }
}
