/**
 * ContentManager -- thin coordinator for IconManager, VectorManager, and MarkerEventManager.
 */
import type { MarkerEventData, MarkerInternal, UpscaleFilterMode, IconScaleFunction } from '../../api/types';
import type { VectorPrimitive } from '../types';
import type { IconRenderer } from '../layers/icons';

import { IconManager } from './icon-manager';
import { VectorManager } from './vector-manager';
import { MarkerEventManager } from './marker-event-manager';

export type { IconDefInput } from './icon-manager';
export type { MarkerEventName } from './marker-event-manager';

export interface ContentManagerDeps {
	getGL(): WebGLRenderingContext;
	getContainer(): HTMLDivElement;
	getZoom(): number;
	getMinZoom(): number;
	getMaxZoom(): number;
	getDpr(): number;
	getCenter(): { x: number; y: number };
	getImageMaxZoom(): number;
	getView(): { center: { x: number; y: number }; zoom: number; minZoom: number; maxZoom: number; wrapX: boolean };
	debugWarn(msg: string, err?: unknown): void;
	debugLog(msg: string): void;
	requestRender(): void;
	clearScreenCache(): void;
	now(): number;
}

export class ContentManager {
	private iconMgr: IconManager;
	private vectorMgr: VectorManager;
	private markerEvents: MarkerEventManager;

	constructor(deps: ContentManagerDeps) {
		this.iconMgr = new IconManager({
			getGL: deps.getGL,
			debugWarn: deps.debugWarn,
			debugLog: deps.debugLog,
			requestRender: deps.requestRender,
			clearScreenCache: deps.clearScreenCache,
		});

		this.vectorMgr = new VectorManager({
			getContainer: deps.getContainer,
			getGL: deps.getGL,
			getDpr: deps.getDpr,
			getZoom: deps.getZoom,
			getCenter: deps.getCenter,
			getImageMaxZoom: deps.getImageMaxZoom,
			requestRender: deps.requestRender,
			debugWarn: deps.debugWarn,
		});

		this.markerEvents = new MarkerEventManager({
			getContainer: deps.getContainer,
			getZoom: deps.getZoom,
			getMinZoom: deps.getMinZoom,
			getMaxZoom: deps.getMaxZoom,
			getCenter: deps.getCenter,
			getImageMaxZoom: deps.getImageMaxZoom,
			getIcons: () => this.iconMgr.icons,
			getIconScaleFunction: () => this.iconMgr.iconScaleFunction,
			debugWarn: deps.debugWarn,
			now: deps.now,
			getView: deps.getView,
		});
	}

	// -- Init phases --

	initRenderers(): void {
		this.iconMgr.init();
	}
	initVectorLayer(): void {
		this.vectorMgr.init();
	}
	initHitTesting(): void {
		this.markerEvents.initHitTesting();
	}

	// -- Icon management (coordinated) --

	async setIconDefs(defs: Record<string, { iconPath: string; x2IconPath?: string; width: number; height: number }>): Promise<void> {
		return this.iconMgr.setIconDefs(defs);
	}

	setMarkers(markers: MarkerInternal[]): void {
		// Clean up hover state before updating markers
		const nextIds = new Set<string>(markers.map((m) => m.id).filter((id): id is string => typeof id === 'string' && id.length > 0));
		this.markerEvents.handleMarkersChanged(nextIds);
		this.iconMgr.setMarkers(markers);
	}

	setDecals(decals: MarkerInternal[]): void {
		this.iconMgr.setDecals(decals);
	}
	setUpscaleFilter(mode: UpscaleFilterMode): void {
		this.iconMgr.setUpscaleFilter(mode);
	}
	setRasterOpacity(opacity: number): void {
		this.iconMgr.setRasterOpacity(opacity);
	}
	setIconScaleFunction(fn: IconScaleFunction | null): void {
		this.iconMgr.setIconScaleFunction(fn);
	}

	// -- Vector management --

	setVectors(vectors: VectorPrimitive[]): void {
		this.vectorMgr.setVectors(vectors);
	}

	// -- Marker events --

	setMarkerData(payloads: Record<string, unknown | null | undefined>): void {
		this.markerEvents.setMarkerData(payloads);
	}
	onMarkerEvent(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', handler: (e: MarkerEventData) => void): () => void {
		return this.markerEvents.onMarkerEvent(name, handler);
	}
	emitMarker(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', payload: MarkerEventData): void {
		this.markerEvents.emitMarker(name, payload);
	}
	hitTestMarker(px: number, py: number, requireAlpha = false) {
		return this.markerEvents.hitTest(px, py, requireAlpha);
	}
	computeMarkerHits(px: number, py: number) {
		return this.markerEvents.computeHits(px, py);
	}
	getMarkerDataById(id: string): unknown | undefined {
		return this.markerEvents.getMarkerDataById(id);
	}

	get lastHover() {
		return this.markerEvents.lastHover;
	}
	set lastHover(v: { type: string; idx: number; id?: string } | null) {
		this.markerEvents.lastHover = v;
	}

	// -- Render frame helpers --

	get icons(): IconRenderer | null {
		return this.iconMgr.icons;
	}
	get rasterOpacity() {
		return this.iconMgr.rasterOpacity;
	}
	get upscaleFilter() {
		return this.iconMgr.upscaleFilter;
	}
	get iconScaleFunction() {
		return this.iconMgr.iconScaleFunction;
	}

	getVectorZIndices(): number[] {
		return this.vectorMgr.getVectorZIndices();
	}
	drawVectors(): void {
		this.vectorMgr.drawVectors();
	}
	drawVectorOverlay(): void {
		this.vectorMgr.drawVectorOverlay();
	}
	resizeVectorLayer(w: number, h: number): void {
		this.vectorMgr.resizeVectorLayer(w, h);
	}
	requestMaskBuild(): void {
		this.iconMgr.requestMaskBuild();
	}

	// -- Lifecycle --

	rebuild(): void {
		this.iconMgr.rebuild();
		this.vectorMgr.rebuild();
	}

	dispose(): void {
		this.iconMgr.dispose();
		this.vectorMgr.dispose();
	}
}
