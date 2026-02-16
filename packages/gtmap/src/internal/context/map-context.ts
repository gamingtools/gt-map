/**
 * MapContext -- lightweight service registry holding shared state and services.
 *
 * Replaces the 200+ closure lambdas wired throughout mapgl.ts. Components
 * request what they need via typed accessors on this object.
 */
import type { EventMap } from '../../api/types';
import { TypedEventBus, setEventBusDebug } from '../events/typed-stream';
import { OptionsManager } from '../core/options-manager';
// Forward references -- these are set during initialization phases.
import type { RenderCoordinator } from '../render/render-coordinator';
import type { InputManager } from '../input/input-manager';
import type { BackgroundUIManager } from '../core/background-ui';
import type { LayerRegistry } from '../layers/layer-registry';

import { DebugLogger } from './debug-logger';
import { GLResources } from './gl-resources';
import { ViewStateStore } from './view-state';
import { MapConfig } from './map-config';

export class MapContext {
	// -- Immutable config --
	readonly container: HTMLDivElement;
	readonly config: MapConfig;

	// -- Mutable view state (single source of truth) --
	readonly viewState: ViewStateStore;

	// -- Core services --
	readonly events: TypedEventBus<EventMap>;
	readonly options: OptionsManager;
	readonly debug: DebugLogger;

	// -- GL resources (set during init, nulled on destroy/releaseGL) --
	canvas!: HTMLCanvasElement;
	gl: WebGLRenderingContext | null = null;
	glResources: GLResources | null = null;

	// -- Sub-systems (set during init phases) --
	renderCoordinator: RenderCoordinator | null = null;
	inputManager: InputManager | null = null;
	bgUI: BackgroundUIManager | null = null;
	layerRegistry: LayerRegistry | null = null;

	// -- Shared interaction state --
	lastInteractAt: number;
	pointerAbs: { x: number; y: number } | null = null;

	// -- Render flag --
	private _needsRender = true;

	constructor(container: HTMLDivElement, config: MapConfig) {
		this.container = container;
		this.config = config;

		// Debug
		this.debug = new DebugLogger(config.debug);
		if (config.debug) setEventBusDebug(true);

		// Event bus
		this.events = new TypedEventBus<EventMap>();

		// Options manager
		this.options = new OptionsManager({ requestRender: () => this.requestRender() });

		// View state
		this.viewState = new ViewStateStore({
			center: config.initialCenter,
			zoom: config.initialZoom,
			minZoom: config.minZoom,
			maxZoom: config.maxZoom,
			mapSize: config.mapSize,
			wrapX: config.wrapX,
			freePan: config.freePan,
			maxBoundsPx: config.maxBoundsPx,
			maxBoundsViscosity: config.maxBoundsViscosity,
			clipToBounds: config.clipToBounds,
			bounceAtZoomLimits: config.bounceAtZoomLimits,
			zoomSnapThreshold: config.zoomSnapThreshold,
		});

		// Interaction timestamp
		this.lastInteractAt = this.debug.now();
	}

	requestRender(): void {
		this._needsRender = true;
	}

	consumeRenderFlag(): boolean {
		const v = this._needsRender;
		this._needsRender = false;
		return v;
	}

	get needsRender(): boolean {
		return this._needsRender;
	}

	now(): number {
		return this.debug.now();
	}
}
