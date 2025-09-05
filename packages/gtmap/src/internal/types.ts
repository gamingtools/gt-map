import type {
	VectorStyle as VectorStyleAPI,
	IconDefInternal,
	MarkerInternal,
	VectorPrimitiveInternal,
	InertiaOptions,
	PrefetchOptions,
	MaxBoundsPx,
	UpscaleFilterMode,
	ActiveOptions,
	IconScaleFunction,
} from '../api/types';

import type { LngLat } from './mapgl';
import type { ProgramLocs } from './render/screenCache';
import type { RasterRenderer } from './layers/raster';
import type { IconRenderer } from './layers/icons';
import type { ScreenCache } from './render/screenCache';
import type { TileCache } from './tiles/cache';
import type { EventBus } from './events/stream';

export type ViewState = {
	center: LngLat;
	zoom: number;
	minZoom: number;
	maxZoom: number;
	wrapX: boolean;
};

export type TileTask = {
	key: string;
	url: string;
	z: number;
	x: number;
	y: number;
	priority: number;
};

export interface TileDeps {
	hasTile(key: string): boolean;
	isPending(key: string): boolean;
	urlFor(z: number, x: number, y: number): string;
	hasCapacity(): boolean;
	now(): number;
	getInteractionIdleMs(): number;
	getLastInteractAt(): number;
	getZoom(): number;
	getMaxZoom(): number;
	getImageMaxZoom(): number;
	getCenter(): LngLat;
	getTileSize(): number;
	getMapSize(): { width: number; height: number };
	getWrapX(): boolean;
	getViewportSizeCSS(): { width: number; height: number };
	startImageLoad(task: { key: string; url: string }): void;
	addPinned(key: string): void;
}

export interface RenderCtx {
	gl: WebGLRenderingContext;
	prog: WebGLProgram;
	loc: ProgramLocs;
	quad: WebGLBuffer;
	canvas: HTMLCanvasElement;
	dpr: number;
	container: HTMLElement;
	zoom: number;
	center: LngLat;
	minZoom: number;
	maxZoom: number;
	mapSize: { width: number; height: number };
	wrapX: boolean;
	useScreenCache: boolean;
	screenCache: ScreenCache | null;
	raster: RasterRenderer;
	icons?: IconRenderer | null;
	tileCache: TileCache;
	tileSize: number;
	sourceMaxZoom?: number;
	rasterOpacity: number;
	// Raster rendering options
	upscaleFilter?: 'auto' | 'linear' | 'bicubic';
	// Icon scaling
	iconScaleFunction?: IconScaleFunction | null;
	// Projection helpers
	project(x: number, y: number, z: number): { x: number; y: number };
	enqueueTile(z: number, x: number, y: number, priority?: number): void;
	// Vectors (optional 2D overlay for early implementation)
	vectorCtx?: CanvasRenderingContext2D | null;
	drawVectors?: () => void;
}

export interface InputDeps {
	getContainer(): HTMLElement;
	getCanvas(): HTMLCanvasElement;
	getMaxZoom(): number;
	getImageMaxZoom(): number;
	getView(): ViewState;
	getTileSize(): number;
	setCenter(lng: number, lat: number): void;
	setZoom(zoom: number): void;
	clampCenterWorld(centerWorld: { x: number; y: number }, zInt: number, scale: number, widthCSS: number, heightCSS: number, viscous?: boolean): { x: number; y: number };
	updatePointerAbs(x: number | null, y: number | null): void;
	emit(name: string, payload: any): void;
	setLastInteractAt(t: number): void;
	getAnchorMode(): 'pointer' | 'center';
	getWheelStep(ctrl: boolean): number;
	startEase(dz: number, px: number, py: number, anchor: 'pointer' | 'center'): void;
	cancelZoomAnim(): void;
	applyAnchoredZoom(targetZoom: number, px: number, py: number, anchor: 'pointer' | 'center'): void;
	// Leaflet-like inertia controls
	getInertia(): boolean;
	getInertiaDecel(): number; // px/s^2
	getInertiaMaxSpeed(): number; // px/s
	getEaseLinearity(): number;
	startPanBy(offsetXPx: number, offsetYPx: number, durationSec: number, ease?: number): void;
	cancelPanAnim(): void;
}

export interface ZoomDeps {
	getZoom(): number;
	getMinZoom(): number;
	getMaxZoom(): number;
	getImageMaxZoom(): number;
	getTileSize(): number;
	shouldAnchorCenterForZoom(targetZoom: number): boolean;
	getMap(): any;
	getOutCenterBias(): number;
	clampCenterWorld(centerWorld: { x: number; y: number }, zInt: number, scale: number, widthCSS: number, heightCSS: number): { x: number; y: number };
	emit(name: string, payload: any): void;
	requestRender(): void;
	now(): number;
}

export interface MapImpl {
	// state
	container: HTMLElement;
	mapSize: { width: number; height: number };
	center: LngLat;
	zoom: number;
	events: EventBus;
	pointerAbs: { x: number; y: number } | null;
	// controls
	setCenter(lng: number, lat: number): void;
	setZoom(z: number): void;
	setTileSource(opts: { url?: string; tileSize?: number; sourceMinZoom?: number; sourceMaxZoom?: number; mapSize?: { width: number; height: number }; wrapX?: boolean; clearCache?: boolean }): void;
	setRasterOpacity(v: number): void;
	setPrefetchOptions(opts: PrefetchOptions): void;
	setGridVisible(on: boolean): void;
	setInertiaOptions(opts: InertiaOptions): void;
	setFpsCap(v: number): void;
	setWrapX(on: boolean): void;
	setMaxBoundsPx(bounds: MaxBoundsPx | null): void;
	setMaxBoundsViscosity(v: number): void;
	setIconDefs(defs: Record<string, IconDefInternal>): Promise<void>;
	setMarkers(markers: MarkerInternal[]): void;
	setVectors?(vectors: VectorPrimitiveInternal[]): void;
	setUpscaleFilter?(mode: UpscaleFilterMode): void;
	setWheelSpeed?(v: number): void;
	resize?(): void;
	setMarkerHitboxesVisible?(on: boolean): void;
	setActive?(on: boolean, opts?: ActiveOptions): void;
	setIconScaleFunction?(fn: IconScaleFunction | null): void;
	destroy(): void;
}

export type VectorStyle = VectorStyleAPI;
export type VectorPrimitive = VectorPrimitiveInternal;
