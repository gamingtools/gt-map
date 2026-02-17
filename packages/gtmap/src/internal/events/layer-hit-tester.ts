/**
 * LayerHitTester -- coordinates hit testing across all interactive layers,
 * respecting z-order (topmost first).
 */
import type { MarkerEventData } from '../../api/types';
import type { ClusterEventData } from '../../api/layers/types';
import type { LayerRegistry } from '../layers/layer-registry';
import type { InteractiveLayerRenderer } from '../layers/interactive-layer-renderer';
import type { HitResult, AllHitsResult, HoverKey } from './marker-hit-testing';

export interface LayerHitTesterDeps {
	layerRegistry: LayerRegistry;
}

export class LayerHitTester {
	private _registry: LayerRegistry;

	/**
	 * Tracks the layer ID that produced the most recent hitTest result.
	 * Used for routing 'down', 'up', 'click', 'enter', and 'longpress' events.
	 */
	private _lastHitSource: string | null = null;

	/**
	 * Tracks the layer ID for the currently hovered marker.
	 * Used for routing 'leave' events to the correct source.
	 */
	private _hoverSource: string | null = null;
	private _lastHover: HoverKey | null = null;

	constructor(deps: LayerHitTesterDeps) {
		this._registry = deps.layerRegistry;
	}

	/**
	 * Hit test across all interactive layers in reverse z-order.
	 * Returns the topmost hit.
	 */
	hitTest(px: number, py: number, requireAlpha: boolean): HitResult | null {
		for (const entry of this._registry.getInteractiveSortedReverse()) {
			if (!entry.state.visible || !entry.renderer) continue;
			const renderer = entry.renderer as unknown as InteractiveLayerRenderer;
			if (!renderer.hitTest) continue;
			const hit = renderer.hitTest(px, py, requireAlpha);
			if (hit) {
				this._lastHitSource = entry.layer.id;
				return hit;
			}
		}
		return null;
	}

	/**
	 * Compute all hits across all interactive layers,
	 * ordered by z (topmost first within each layer, highest-z layer first).
	 */
	computeHits(px: number, py: number): AllHitsResult[] {
		const out: AllHitsResult[] = [];
		for (const entry of this._registry.getInteractiveSortedReverse()) {
			if (!entry.state.visible || !entry.renderer) continue;
			const renderer = entry.renderer as unknown as InteractiveLayerRenderer;
			if (!renderer.computeHits) continue;
			const hits = renderer.computeHits(px, py);
			for (const h of hits) out.push(h);
		}
		return out;
	}

	/**
	 * Emit a marker event, routing to the correct layer.
	 * 'leave' events are routed to the hover source (where the cursor WAS).
	 * All other events are routed to the last hit source (where the cursor IS).
	 */
	emitMarker(name: 'enter' | 'leave' | 'click' | 'down' | 'up' | 'longpress', payload: MarkerEventData): void {
		const source = name === 'leave' ? this._hoverSource : this._lastHitSource;
		if (source != null) {
			const entry = this._registry.get(source);
			if (entry?.renderer) {
				const renderer = entry.renderer as unknown as InteractiveLayerRenderer;
				renderer.emitMarker(name, payload);
			}
		}
	}

	getLastHover(): HoverKey | null {
		return this._lastHover;
	}

	setLastHover(h: HoverKey | null): void {
		this._lastHover = h;
		this._hoverSource = h != null ? this._lastHitSource : null;
	}

	/**
	 * Look up marker data by ID across all layers.
	 */
	getMarkerDataById(id: string): unknown | null | undefined {
		for (const entry of this._registry.getInteractiveSortedReverse()) {
			if (!entry.renderer) continue;
			const renderer = entry.renderer as unknown as InteractiveLayerRenderer;
			if (!renderer.getMarkerDataById) continue;
			const data = renderer.getMarkerDataById(id);
			if (data !== undefined) return data;
		}
		return undefined;
	}

	private _getClusterForMarkerInLayer(layerId: string, markerId: string): ClusterEventData | undefined {
		const entry = this._registry.get(layerId);
		if (!entry?.renderer) return undefined;
		const renderer = entry.renderer as unknown as { getClusterForMarkerId?: (id: string) => ClusterEventData | undefined };
		if (!renderer.getClusterForMarkerId) return undefined;
		return renderer.getClusterForMarkerId(markerId);
	}

	getClusterForMarkerId(id: string): ClusterEventData | undefined {
		// Prefer the source layer from the current hit path.
		if (this._lastHitSource) {
			const fromLastHit = this._getClusterForMarkerInLayer(this._lastHitSource, id);
			if (fromLastHit) return fromLastHit;
		}
		// Fallback to the current hover source (for leave/hover transitions).
		if (this._hoverSource && this._hoverSource !== this._lastHitSource) {
			const fromHover = this._getClusterForMarkerInLayer(this._hoverSource, id);
			if (fromHover) return fromHover;
		}
		// Final fallback: scan all interactive layers.
		for (const entry of this._registry.getInteractiveSortedReverse()) {
			if (entry.layer.id === this._lastHitSource || entry.layer.id === this._hoverSource) continue;
			if (!entry.renderer) continue;
			const renderer = entry.renderer as unknown as { getClusterForMarkerId?: (markerId: string) => ClusterEventData | undefined };
			if (!renderer.getClusterForMarkerId) continue;
			const cluster = renderer.getClusterForMarkerId(id);
			if (cluster) return cluster;
		}
		return undefined;
	}
}
