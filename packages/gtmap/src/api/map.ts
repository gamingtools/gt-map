/**
 * GTMap - A high-performance WebGL map renderer with a pixel-based coordinate system.
 *
 * Decomposed public API: `map.view`, `map.input`, `map.content`, `map.display`.
 * Root-level shorthands delegate to the appropriate facade.
 */
import { MapEngine } from '../internal/map-engine';
import type { ViewTransition } from '../internal/core/view-transition';
import type { MarkerOptions } from '../entities/marker';
import type { DecalOptions } from '../entities/decal';
import type { Marker } from '../entities/marker';
import type { Decal } from '../entities/decal';
import type { Vector } from '../entities/vector';
import type { EntityCollection } from '../entities/entity-collection';

import type { MapEvents } from './events/public';
import type { VectorGeometry as VectorGeom } from './events/maps';
import type { Point, MapOptions, IconDef, IconHandle, SuspendOptions, IconScaleFunction, MaxBoundsPx, UpscaleFilterMode } from './types';
import { ViewFacade } from './facades/view-facade';
import { InputFacade } from './facades/input-facade';
import { ContentFacade } from './facades/content-facade';
import { DisplayFacade } from './facades/display-facade';

// Re-export types from centralized types file
export type { Point, MapOptions, IconDef, IconHandle, VectorStyle, Polyline, Polygon, Circle, SuspendOptions } from './types';
export { Marker } from '../entities/marker';
export { Decal } from '../entities/decal';
export { Vector } from '../entities/vector';
export { EntityCollection } from '../entities/entity-collection';

// Re-export Visual classes and types
export { Visual, ImageVisual, TextVisual, CircleVisual, RectVisual, SvgVisual, HtmlVisual } from './visual';
export { isImageVisual, isTextVisual, isCircleVisual, isRectVisual, isSvgVisual, isHtmlVisual } from './visual';
export type { VisualType, AnchorPreset, AnchorPoint, Anchor, VisualSize, SvgShadow } from './visual';

// Re-export ViewTransition interface
export type { ViewTransition };

import type { Bounds as SourceBounds, TransformType } from './coord-transformer';

/**
 * @group Overview
 */
export class GTMap<TMarkerData = unknown, TVectorData = unknown> {
	private _engine: MapEngine;

	/** View control: center, zoom, transitions, bounds, coordinates. */
	readonly view: ViewFacade;
	/** Input settings: wheel speed, inertia. */
	readonly input: InputFacade;
	/** Content management: markers, decals, vectors, icons. */
	readonly content: ContentFacade<TMarkerData, TVectorData>;
	/** Display settings: background, grid, upscale filter, FPS. */
	readonly display: DisplayFacade;

	constructor(container: HTMLElement, options: MapOptions) {
		const tiles = options?.tiles;
		if (!tiles) throw new Error('GTMap: tiles is required in MapOptions');
		if (!tiles.url || typeof tiles.url !== 'string') throw new Error('GTMap: tiles.url must be a non-empty string');
		if (!Number.isFinite(tiles.tileSize) || tiles.tileSize <= 0) throw new Error('GTMap: tiles.tileSize must be a positive number');
		if (!tiles.mapSize || !Number.isFinite(tiles.mapSize.width) || !Number.isFinite(tiles.mapSize.height)) throw new Error('GTMap: tiles.mapSize must have width and height');
		if (Number.isFinite(options.minZoom as number) && Number.isFinite(options.maxZoom as number) && (options.minZoom as number) > (options.maxZoom as number)) {
			throw new Error('GTMap: minZoom must be <= maxZoom');
		}

		this._engine = new MapEngine(container as HTMLDivElement, options);
		this.view = new ViewFacade(this._engine);
		this.input = new InputFacade(this._engine);
		this.content = new ContentFacade<TMarkerData, TVectorData>(this._engine);
		this.display = new DisplayFacade(this._engine);
	}

	// -- Shorthand: Entity collections (delegate to content) --

	/** Marker collection. */
	get markers(): EntityCollection<Marker<TMarkerData>> {
		return this.content.markers;
	}

	/** Decal collection. */
	get decals(): EntityCollection<Decal> {
		return this.content.decals;
	}

	/** Vector collection. */
	get vectors(): EntityCollection<Vector<TVectorData>> {
		return this.content.vectors;
	}

	// -- Shorthand: View --

	getCenter(): Point {
		return this.view.getCenter();
	}

	getZoom(): number {
		return this.view.getZoom();
	}

	getPointerAbs(): { x: number; y: number } | null {
		return this.view.getPointerAbs();
	}

	transition(): ViewTransition {
		return this.view.transition();
	}

	setWrapX(on: boolean): this {
		this.view.setWrapX(on);
		return this;
	}

	setMaxBoundsPx(bounds: MaxBoundsPx | null): this {
		this.view.setMaxBoundsPx(bounds);
		return this;
	}

	setMaxBoundsViscosity(v: number): this {
		this.view.setMaxBoundsViscosity(v);
		return this;
	}

	setClipToBounds(on: boolean): this {
		this.view.setClipToBounds(on);
		return this;
	}

	setIconScaleFunction(fn: IconScaleFunction | null): this {
		this.view.setIconScaleFunction(fn);
		return this;
	}

	resetIconScale(): this {
		this.view.resetIconScale();
		return this;
	}

	setAutoResize(on: boolean): this {
		this.view.setAutoResize(on);
		return this;
	}

	invalidateSize(): this {
		this.view.invalidateSize();
		return this;
	}

	setCoordBounds(bounds: SourceBounds): this {
		this.view.setCoordBounds(bounds);
		return this;
	}

	translate(x: number, y: number, type: TransformType = 'original'): { x: number; y: number } {
		return this.view.translate(x, y, type);
	}

	// -- Shorthand: Content --

	addIcon(def: IconDef, id?: string): IconHandle {
		return this.content.addIcon(def, id);
	}

	addMarker(x: number, y: number, opts: MarkerOptions<TMarkerData>): Marker<TMarkerData> {
		return this.content.addMarker(x, y, opts);
	}

	addDecal(x: number, y: number, opts: DecalOptions): Decal {
		return this.content.addDecal(x, y, opts);
	}

	addVector(geometry: VectorGeom, opts?: { data?: TVectorData }): Vector<TVectorData> {
		return this.content.addVector(geometry, opts);
	}

	clearMarkers(): this {
		this.content.clearMarkers();
		return this;
	}

	clearDecals(): this {
		this.content.clearDecals();
		return this;
	}

	clearVectors(): this {
		this.content.clearVectors();
		return this;
	}

	// -- Shorthand: Display --

	setGridVisible(on: boolean): this {
		this.display.setGridVisible(on);
		return this;
	}

	setUpscaleFilter(mode: UpscaleFilterMode): this {
		this.display.setUpscaleFilter(mode);
		return this;
	}

	setZoomSnapThreshold(v: number): this {
		this.display.setZoomSnapThreshold(v);
		return this;
	}

	setFpsCap(v: number): this {
		this.display.setFpsCap(v);
		return this;
	}

	setBackgroundColor(color: string | { r: number; g: number; b: number; a?: number }): this {
		this.display.setBackgroundColor(color);
		return this;
	}

	// -- Shorthand: Input --

	setWheelSpeed(v: number): this {
		this.input.setWheelSpeed(v);
		return this;
	}

	// -- Lifecycle --

	suspend(opts?: SuspendOptions): this {
		this._engine.setActive(false, opts);
		return this;
	}

	resume(): this {
		this._engine.setActive(true);
		return this;
	}

	destroy(): void {
		this._engine.destroy();
	}

	// -- Events --

	get events(): MapEvents<TMarkerData> {
		return {
			on: (name: string, handler?: (value: unknown) => void) => {
				const stream = this._engine.events.on(name as keyof import('./types').EventMap);
				return handler ? stream.each(handler) : stream;
			},
			once: (name: string) => this._engine.events.when(name as keyof import('./types').EventMap),
		} as MapEvents<TMarkerData>;
	}

	// -- Internal helpers (used by ViewTransition) --

	/** @internal */
	_applyInstant(center?: Point, zoom?: number): void {
		this.view._applyInstant(center, zoom);
	}

	/** @internal */
	_animateView(opts: { center?: Point; zoom?: number; durationMs: number; easing?: (t: number) => number }): void {
		this.view._animateView(opts);
	}

	/** @internal */
	_cancelPanZoom(): void {
		this.view._cancelPanZoom();
	}

	/** @internal */
	_fitBounds(b: { minX: number; minY: number; maxX: number; maxY: number }, padding: { top: number; right: number; bottom: number; left: number }): { center: Point; zoom: number } {
		return this.view._fitBounds(b, padding);
	}

	/** @internal */
	_setView(center: Point, zoom: number, opts?: { animate?: { durationMs: number; delayMs?: number; easing?: (t: number) => number } }): Promise<import('./types').ApplyResult> {
		return this.view._setView(center, zoom, opts);
	}
}
