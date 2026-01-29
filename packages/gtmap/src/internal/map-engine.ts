/**
 * MapEngine -- thin coordinator implementing MapImpl.
 *
 * Creates MapContext and LifecycleManager, then delegates all
 * MapImpl methods to the appropriate sub-managers.
 * Replaces the 1585-line mapgl.ts god class.
 */
import type {
	MarkerInternal,
	MarkerEventData,
	InertiaOptions,
	MaxBoundsPx,
	UpscaleFilterMode,
	SuspendOptions,
	IconScaleFunction,
} from '../api/types';
import type { MapOptions } from '../api/types';

import type { MapImpl, VectorPrimitive } from './types';
import type { LngLat } from './context/view-state';
import { MapConfig } from './context/map-config';
import { MapContext } from './context/map-context';
import { LifecycleManager } from './lifecycle/lifecycle-manager';

export type IconDefInput = { iconPath: string; x2IconPath?: string; width: number; height: number };

export class MapEngine implements MapImpl {
	private _ctx: MapContext;
	private _lifecycle: LifecycleManager;

	constructor(container: HTMLDivElement, options: MapOptions) {
		const config = new MapConfig(options);
		this._ctx = new MapContext(container, config);
		this._lifecycle = new LifecycleManager(this._ctx);
		this._lifecycle.init();
	}

	// -- State accessors (MapImpl) --

	get container(): HTMLElement {
		return this._ctx.container;
	}

	get mapSize() {
		return this._ctx.viewState.mapSize;
	}

	get center(): LngLat {
		return this._ctx.viewState.center;
	}

	get zoom(): number {
		return this._ctx.viewState.zoom;
	}

	get events() {
		return this._ctx.events;
	}

	get pointerAbs() {
		return this._ctx.pointerAbs;
	}

	set pointerAbs(v: { x: number; y: number } | null) {
		this._ctx.pointerAbs = v;
	}

	// -- Context access (for facades) --

	get context(): MapContext {
		return this._ctx;
	}

	get lifecycle(): LifecycleManager {
		return this._lifecycle;
	}

	// -- View controls --

	setCenter(lng: number, lat: number): void {
		this._ctx.viewState.setCenter(lng, lat);
		this._ctx.requestRender();
	}

	setZoom(z: number): void {
		this._ctx.viewState.setZoom(z);
		this._ctx.requestRender();
	}

	getMinZoom(): number {
		return this._ctx.viewState.minZoom;
	}

	getMaxZoom(): number {
		return this._ctx.viewState.maxZoom;
	}

	getImageMaxZoom(): number {
		return this._ctx.viewState.imageMaxZoom;
	}

	// -- Tile source --

	setTileSource(opts: { url: string; tileSize: number; mapSize: { width: number; height: number }; sourceMinZoom: number; sourceMaxZoom: number }): void {
		this._ctx.tileManager?.setSource(opts);
		this._ctx.requestRender();
	}

	// -- Content --

	async setIconDefs(defs: Record<string, IconDefInput>): Promise<void> {
		return this._ctx.contentManager?.setIconDefs(defs);
	}

	setMarkers(markers: MarkerInternal[]): void {
		this._ctx.contentManager?.setMarkers(markers);
	}

	setDecals(markers: MarkerInternal[]): void {
		this._ctx.contentManager?.setDecals(markers);
	}

	setVectors(vectors: VectorPrimitive[]): void {
		this._ctx.contentManager?.setVectors(vectors);
	}

	setRasterOpacity(v: number): void {
		this._ctx.contentManager?.setRasterOpacity(v);
	}

	setUpscaleFilter(mode: UpscaleFilterMode): void {
		this._ctx.contentManager?.setUpscaleFilter(mode);
	}

	setIconScaleFunction(fn: IconScaleFunction | null): void {
		this._ctx.contentManager?.setIconScaleFunction(fn);
	}

	setMarkerData(payloads: Record<string, unknown | null | undefined>): void {
		this._ctx.contentManager?.setMarkerData(payloads);
	}

	onMarkerEvent(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', handler: (e: MarkerEventData) => void): () => void {
		return this._ctx.contentManager?.onMarkerEvent(name, handler) ?? (() => {});
	}

	// -- Display --

	setGridVisible(on: boolean): void {
		this._ctx.renderCoordinator?.setGridVisible(on);
	}

	setFpsCap(v: number): void {
		this._ctx.renderCoordinator?.setFpsCap(v);
	}

	setBackgroundColor(color: string | { r: number; g: number; b: number; a?: number }): void {
		this._lifecycle.setBackgroundColor(color);
	}

	// -- Navigation --

	setWrapX(on: boolean): void {
		const vs = this._ctx.viewState;
		if (!!on !== vs.wrapX) {
			vs.wrapX = !!on;
			this._ctx.requestRender();
		}
	}

	setMaxBoundsPx(bounds: MaxBoundsPx | null): void {
		this._ctx.viewState.maxBoundsPx = bounds ? { ...bounds } : null;
		this._ctx.requestRender();
	}

	setMaxBoundsViscosity(v: number): void {
		this._ctx.viewState.maxBoundsViscosity = Math.max(0, Math.min(1, v));
		this._ctx.requestRender();
	}

	setClipToBounds(on: boolean): void {
		const vs = this._ctx.viewState;
		if (!!on !== vs.clipToBounds) {
			vs.clipToBounds = !!on;
			this._ctx.requestRender();
		}
	}

	setInertiaOptions(opts: InertiaOptions): void {
		this._ctx.options.setInertiaOptions(opts);
	}

	setWheelSpeed(v: number): void {
		this._ctx.options.setWheelSpeed(v);
	}

	// -- Animated controls --

	panTo(lng: number, lat: number, durationMs?: number): void {
		this._ctx.renderCoordinator?.panTo(lng, lat, durationMs);
	}

	flyTo(opts: { lng?: number; lat?: number; zoom?: number; durationMs?: number; easing?: (t: number) => number }): void {
		this._ctx.renderCoordinator?.flyTo(opts);
	}

	cancelPanAnim(): void {
		this._ctx.renderCoordinator?.panController.cancel();
	}

	cancelZoomAnim(): void {
		this._ctx.renderCoordinator?.zoomController.cancel();
	}

	// -- Resize --

	resize(): void {
		this._ctx.renderCoordinator?.resize();
	}

	// -- Lifecycle --

	setActive(on: boolean, opts?: SuspendOptions): void {
		this._lifecycle.setActive(on, opts);
	}

	setAutoResize(on: boolean): void {
		this._lifecycle.setAutoResize(on);
	}

	destroy(): void {
		this._lifecycle.destroy();
	}
}
