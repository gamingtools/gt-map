/**
 * MarkerEventManager -- hit testing, marker event dispatch, hover state.
 */
import type { MarkerEventData, IconScaleFunction } from '../../api/types';
import type { IconRenderer } from '../layers/icons';
import { MarkerHitTesting } from '../events/marker-hit-testing';

export type MarkerEventName = 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress';

export interface MarkerEventManagerDeps {
  getContainer(): HTMLDivElement;
  getZoom(): number;
  getMinZoom(): number;
  getMaxZoom(): number;
  getCenter(): { x: number; y: number };
  getImageMaxZoom(): number;
  getIcons(): IconRenderer | null;
  getIconScaleFunction(): IconScaleFunction | null;
  debugWarn(msg: string, err?: unknown): void;
  now(): number;
  getView(): { center: { x: number; y: number }; zoom: number; minZoom: number; maxZoom: number; wrapX: boolean };
}

export class MarkerEventManager {
  private deps: MarkerEventManagerDeps;
  private _hitTesting: MarkerHitTesting | null = null;
  private _lastHover: { type: string; idx: number; id?: string } | null = null;
  private _markerSinks: Record<MarkerEventName, Set<(e: MarkerEventData) => void>> = {
    enter: new Set(),
    leave: new Set(),
    click: new Set(),
    down: new Set(),
    up: new Set(),
    longpress: new Set(),
  };
  private _markerData = new Map<string, unknown | null | undefined>();

  constructor(deps: MarkerEventManagerDeps) {
    this.deps = deps;
  }

  // -- Init --

  initHitTesting(): void {
    const d = this.deps;
    this._hitTesting = new MarkerHitTesting({
      getContainer: () => d.getContainer(),
      getZoom: () => d.getZoom(),
      getMinZoom: () => d.getMinZoom(),
      getMaxZoom: () => d.getMaxZoom(),
      getCenter: () => d.getCenter(),
      getImageMaxZoom: () => d.getImageMaxZoom(),
      getIcons: () => d.getIcons(),
      getIconScaleFunction: () => d.getIconScaleFunction(),
    });
  }

  // -- Event registration --

  onMarkerEvent(name: MarkerEventName, handler: (e: MarkerEventData) => void): () => void {
    const set = this._markerSinks[name];
    set.add(handler);
    return () => set.delete(handler);
  }

  emitMarker(name: MarkerEventName, payload: MarkerEventData): void {
    const set = this._markerSinks[name];
    if (!set || set.size === 0) return;
    for (const fn of Array.from(set)) {
      try {
        fn(payload);
      } catch { /* expected: user marker event handler may throw */ }
    }
  }

  // -- Hit testing --

  hitTest(px: number, py: number, requireAlpha = false) {
    return this._hitTesting?.hitTest(px, py, requireAlpha) ?? null;
  }

  computeHits(px: number, py: number) {
    return this._hitTesting?.computeAllHits(px, py) ?? [];
  }

  // -- Marker data --

  setMarkerData(payloads: Record<string, unknown | null | undefined>): void {
    try {
      for (const k of Object.keys(payloads)) this._markerData.set(k, payloads[k]);
    } catch (e) { this.deps.debugWarn('setMarkerData', e); }
  }

  getMarkerDataById(id: string): unknown | undefined {
    return this._markerData.get(id);
  }

  // -- Hover state --

  get lastHover() {
    return this._lastHover;
  }

  set lastHover(v: { type: string; idx: number; id?: string } | null) {
    this._lastHover = v;
  }

  /**
   * Called when markers change to clean up stale hover state.
   * Emits a leave event if the currently hovered marker was removed.
   */
  handleMarkersChanged(nextIds: Set<string>): void {
    try {
      if (this._lastHover && this._lastHover.id && !nextIds.has(this._lastHover.id)) {
        const prev = this._lastHover;
        const now = this.deps.now();
        this.emitMarker('leave', {
          now,
          view: this.deps.getView(),
          screen: { x: -1, y: -1 },
          marker: { id: prev.id || '', index: prev.idx ?? -1, world: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
          icon: { id: prev.type, iconPath: '', width: 0, height: 0, anchorX: 0, anchorY: 0 },
        });
        this._lastHover = null;
      }
    } catch (e) { this.deps.debugWarn('marker hover cleanup', e); }
  }
}
