import type {
	EventMap,
	ViewState as PublicViewState,
	VectorStyle as VectorStyleAPI,
	IconDefInternal,
	MarkerInternal,
	VectorPrimitiveInternal,
	InertiaOptions,
	MaxBoundsPx,
	UpscaleFilterMode,
	ActiveOptions,
	IconScaleFunction,
	MarkerEventData,
} from '../api/types';
// (no direct import of PublicEvents here to keep internals decoupled)

// Minimal internal event bus used by the renderer.
// It exposes `.on(event).each(handler)` and `.when(event)`.
type InternalEventBus = {
  on<K extends keyof EventMap & string>(event: K): { each(handler: (value: EventMap[K]) => void): () => void };
  when<K extends keyof EventMap & string>(event: K): Promise<EventMap[K]>;
};

import type { LngLat } from './mapgl';
import type { ProgramLocs } from './render/screen-cache';
import type { RasterRenderer } from './layers/raster';
import type { IconRenderer } from './layers/icons';
import type { ScreenCache } from './render/screen-cache';

export type ViewState = {
	center: LngLat;
	zoom: number;
	minZoom: number;
	maxZoom: number;
	wrapX: boolean;
};

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
	imageMaxZoom: number;
	mapSize: { width: number; height: number };
	wrapX: boolean;
	useScreenCache: boolean;
	screenCache: ScreenCache | null;
	raster: RasterRenderer;
	icons?: IconRenderer | null;
	rasterOpacity: number;
	upscaleFilter?: UpscaleFilterMode;
	iconScaleFunction?: IconScaleFunction | null;
	isIdle?: () => boolean;
	project(x: number, y: number, z: number): { x: number; y: number };
	image: {
		texture: WebGLTexture | null;
		width: number;
		height: number;
		ready: boolean;
	};
	vectorCtx?: CanvasRenderingContext2D | null;
	drawVectors?: () => void;
}

export interface InputDeps {
	getContainer(): HTMLElement;
	getCanvas(): HTMLCanvasElement;
	getMaxZoom(): number;
	getImageMaxZoom(): number;
	getView(): PublicViewState;
	setCenter(lng: number, lat: number): void;
	setZoom(zoom: number): void;
	clampCenterWorld(centerWorld: { x: number; y: number }, zInt: number, scale: number, widthCSS: number, heightCSS: number, viscous?: boolean): { x: number; y: number };
	updatePointerAbs(x: number | null, y: number | null): void;
	emit<K extends keyof EventMap>(name: K, payload: EventMap[K]): void;
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
	shouldAnchorCenterForZoom(targetZoom: number): boolean;
	getContainer(): HTMLElement;
	getBoundsPx(): { minX: number; minY: number; maxX: number; maxY: number } | null;
	getBounceAtZoomLimits(): boolean;
	setCenterLngLat(lng: number, lat: number): void;
	setZoom(z: number): void;
	getOutCenterBias(): number;
	clampCenterWorld(centerWorld: { x: number; y: number }, zInt: number, scale: number, widthCSS: number, heightCSS: number): { x: number; y: number };
	emit<K extends keyof EventMap>(name: K, payload: EventMap[K]): void;
	requestRender(): void;
	now(): number;
	getPublicView(): PublicViewState;
}

export interface PanDeps {
    getZoom(): number;
    getImageMaxZoom(): number;
    getContainer(): HTMLElement;
    getWrapX(): boolean;
    getFreePan(): boolean;
    getMapSize(): { width: number; height: number };
    getMaxZoom(): number;
    getMaxBoundsPx(): { minX: number; minY: number; maxX: number; maxY: number } | null;
    getMaxBoundsViscosity(): number;
    getCenter(): { x: number; y: number }; // native pixels
    setCenter(lng: number, lat: number): void; // native pixels
    requestRender(): void;
    emit<K extends keyof EventMap>(name: K, payload: EventMap[K]): void;
    now(): number;
    getPublicView(): PublicViewState;
}

export interface MapImpl {
	// state
	container: HTMLElement;
	mapSize: { width: number; height: number };
	center: LngLat;
	zoom: number;
	events: InternalEventBus;
	pointerAbs: { x: number; y: number } | null;
	// controls
	setCenter(lng: number, lat: number): void;
	setZoom(z: number): void;
	setImageSource(opts: { url: string; width: number; height: number }): void;
	setRasterOpacity(v: number): void;
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
	setAutoResize?(on: boolean): void;
	setBackgroundColor?(color: string | { r: number; g: number; b: number; a?: number }): void;
    // Optional: user payloads per marker id
    setMarkerData?(payloads: Record<string, unknown | null | undefined>): void;
	// Internal marker event sink (facade wires to entity events)
	onMarkerEvent?(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', handler: (e: MarkerEventData) => void): () => void;
	// Optional animated controls
	panTo?(lng: number, lat: number, durationMs?: number): void;
    flyTo?(opts: { lng?: number; lat?: number; zoom?: number; durationMs?: number; easing?: (t: number) => number }): void;
    // Optional animation cancellation
    cancelPanAnim?(): void;
    cancelZoomAnim?(): void;
    // Read accessors for zoom ranges used by facade utilities
    getMinZoom(): number;
    getMaxZoom(): number;
    getImageMaxZoom(): number;
    destroy(): void;
}

export type VectorStyle = VectorStyleAPI;
export type VectorPrimitive = VectorPrimitiveInternal;
