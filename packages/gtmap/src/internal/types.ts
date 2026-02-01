import type {
	EventMap,
	ViewState as PublicViewState,
	VectorStyle as VectorStyleAPI,
	VectorPrimitiveInternal,
	UpscaleFilterMode,
	IconScaleFunction,
} from '../api/types';

import type { PixelPoint } from './context/view-state';
import type { ProgramLocs } from './render/screen-cache';
import type { RasterRenderer } from './layers/raster';
import type { IconRenderer } from './layers/icons';
import type { ScreenCache } from './render/screen-cache';
import type { TileCache } from './tiles/cache';

export type ViewState = {
	center: PixelPoint;
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
	center: PixelPoint;
	minZoom: number;
	maxZoom: number;
	imageMaxZoom: number;
	mapSize: { width: number; height: number };
	wrapX: boolean;
	zoomSnapThreshold: number;
	useScreenCache: boolean;
	screenCache: ScreenCache | null;
	raster: RasterRenderer;
	icons?: IconRenderer | null;
	rasterOpacity: number;
	upscaleFilter?: UpscaleFilterMode;
	iconScaleFunction?: IconScaleFunction | null;
	isIdle?: () => boolean;
	project(x: number, y: number, z: number): { x: number; y: number };
	// Tile fields
	tileCache: TileCache;
	tileSize: number;
	sourceMaxZoom: number;
	enqueueTile(z: number, x: number, y: number, priority?: number): void;
	wantTileKey(key: string): void;
	vectorCtx?: CanvasRenderingContext2D | null;
	drawVectors?: () => void;
	/** Vector z-indices for overlay interleaving */
	vectorZIndices?: number[];
	/** Callback to draw vector overlay at a given z-index */
	drawVectorOverlay?: () => void;
}

export interface InputDeps {
	getContainer(): HTMLElement;
	getCanvas(): HTMLCanvasElement;
	getMaxZoom(): number;
	getImageMaxZoom(): number;
	getView(): PublicViewState;
	setCenter(x: number, y: number): void;
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

export interface ControllerDepsBase {
	getZoom(): number;
	getMaxZoom(): number;
	getImageMaxZoom(): number;
	getContainer(): HTMLElement;
	getMaxBoundsPx(): { minX: number; minY: number; maxX: number; maxY: number } | null;
	setCenter(x: number, y: number): void;
	requestRender(): void;
	emit<K extends keyof EventMap>(name: K, payload: EventMap[K]): void;
	now(): number;
	getPublicView(): PublicViewState;
}

export interface ZoomDeps extends ControllerDepsBase {
	getMinZoom(): number;
	getBounceAtZoomLimits(): boolean;
	setZoom(z: number): void;
	getOutCenterBias(): number;
	clampCenterWorld(centerWorld: { x: number; y: number }, zInt: number, scale: number, widthCSS: number, heightCSS: number): { x: number; y: number };
}

export interface PanDeps extends ControllerDepsBase {
	getWrapX(): boolean;
	getFreePan(): boolean;
	getMapSize(): { width: number; height: number };
	getMaxBoundsViscosity(): number;
	getCenter(): { x: number; y: number };
}

export type VectorStyle = VectorStyleAPI;
export type VectorPrimitive = VectorPrimitiveInternal;
