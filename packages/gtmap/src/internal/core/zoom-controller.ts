import type { ZoomDeps } from '../types';
import { DEBUG } from '../../debug';
import * as Coords from '../coords';

export default class ZoomController {
	private deps: ZoomDeps;
	private easeBaseMs = 150;
	private easePerUnitMs = 240;
	private easeMinMs = 120;
	private easeMaxMs = 420;
	private zoomAnim: null | {
		from: number;
		to: number;
		px: number;
		py: number;
		start: number;
		dur: number;
		anchor: 'pointer' | 'center';
		bounce?: boolean;
		easing?: (t: number) => number;
	} = null;

	constructor(deps: ZoomDeps) {
		this.deps = deps;
	}
	isAnimating(): boolean {
		return !!this.zoomAnim;
	}
	cancel() {
		this.zoomAnim = null;
	}
	startEase(dz: number, px: number, py: number, anchor: 'pointer' | 'center', easing?: (t: number) => number) {
		const now = this.deps.now();
		let current = this.deps.getZoom();
		if (this.zoomAnim) {
			const a = this.zoomAnim;
			const t = Math.min(1, (now - a.start) / a.dur);
			const ef = a.easing || ((tt: number) => 1 - Math.pow(1 - tt, 3));
			const eased = ef(t);
			current = a.from + (a.to - a.from) * eased;
		}
		let to = Math.max(this.deps.getMinZoom(), Math.min(this.deps.getMaxZoom(), current + dz));
		// Bounds-based min zoom + optional bounce at zoom limits
		let bounce = false;
		try {
			const rect = this.deps.getContainer()?.getBoundingClientRect?.();
			const mb = this.deps.getBoundsPx?.();
			if (mb && rect) {
				const widthCSS = rect.width;
				const heightCSS = rect.height;
				const boundsW = Math.max(1, mb.maxX - mb.minX);
				const boundsH = Math.max(1, mb.maxY - mb.minY);
				const zMaxImg = this.deps.getImageMaxZoom();
				const minZByW = zMaxImg + Math.log2(widthCSS / boundsW);
				const minZByH = zMaxImg + Math.log2(heightCSS / boundsH);
				const minZByBounds = Math.max(minZByW, minZByH);
				if (isFinite(minZByBounds) && to < minZByBounds) {
					bounce = !!this.deps.getBounceAtZoomLimits?.();
					to = minZByBounds;
				}
			}
		} catch {}
		const dist = Math.abs(to - current);
		const raw = this.easeBaseMs + this.easePerUnitMs * dist;
		const dur = Math.max(this.easeMinMs, Math.min(this.easeMaxMs, raw));
		this.zoomAnim = { from: current, to, px, py, start: now, dur, anchor, bounce, easing };
		this.deps.requestRender();
	}
	step(): boolean {
		if (!this.zoomAnim) return false;
		const now = this.deps.now();
		const a = this.zoomAnim;
		const t = Math.min(1, (now - a.start) / a.dur);
		const ef = a.easing || ((tt: number) => 1 - Math.pow(1 - tt, 3));
		let z = a.from + (a.to - a.from) * ef(t);
		if (a.bounce) {
			// easeOutBack to create a slight overshoot and return
			const c1 = 1.70158,
				c3 = c1 + 1;
			const tb = t - 1;
			const outBack = 1 + c3 * (tb * tb * tb) + c1 * (tb * tb);
			z = a.from + (a.to - a.from) * outBack;
		}
		this.applyAnchoredZoom(z, a.px, a.py, a.anchor);
		if (t >= 1) {
			this.zoomAnim = null;
			this.deps.emit('zoomend', { view: this.deps.getPublicView() });
		}
		return true;
	}

	applyAnchoredZoom(targetZoom: number, px: number, py: number, anchor: 'pointer' | 'center') {
		// Respect the requested anchor; default is 'pointer'.
		const anchorEff: 'pointer' | 'center' = anchor;
		const { zInt, scale } = Coords.zParts(this.deps.getZoom());
		const rect = this.deps.getContainer().getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;
		const zImg = this.deps.getImageMaxZoom();
		const s0 = Coords.sFor(zImg, zInt);
		// Derive current center from public view
		const view = this.deps.getPublicView();
		const centerNow = { x: view.center.x / s0, y: view.center.y / s0 };
		const tlWorld = Coords.tlLevelFor(centerNow, view.zoom, { x: widthCSS, y: heightCSS });
		let zClamped = Math.max(this.deps.getMinZoom(), Math.min(this.deps.getMaxZoom(), targetZoom));
		// If maxBounds are set, prevent zooming out beyond bounds (Leaflet-like)
		try {
			const mb = this.deps.getBoundsPx?.();
			if (mb) {
				const rect = this.deps.getContainer().getBoundingClientRect();
				const widthCSS = rect.width;
				const heightCSS = rect.height;
				const boundsW = Math.max(1, mb.maxX - mb.minX);
				const boundsH = Math.max(1, mb.maxY - mb.minY);
				const zMaxImg = this.deps.getImageMaxZoom();
				const minZByW = zMaxImg + Math.log2(widthCSS / boundsW);
				const minZByH = zMaxImg + Math.log2(heightCSS / boundsH);
				const minZByBounds = Math.max(minZByW, minZByH);
				if (isFinite(minZByBounds)) zClamped = Math.max(zClamped, minZByBounds);
			}
		} catch {}
		const { zInt: zInt2, scale: s2 } = Coords.zParts(zClamped);
		let center2: { x: number; y: number };
		if (anchorEff === 'center') {
			const factor = Math.pow(2, zInt2 - zInt);
			center2 = { x: centerNow.x * factor, y: centerNow.y * factor };
		} else {
			const worldBefore = { x: tlWorld.x + px / scale, y: tlWorld.y + py / scale };
			const factor = Math.pow(2, zInt2 - zInt);
			const worldBefore2 = { x: worldBefore.x * factor, y: worldBefore.y * factor };
			const tl2 = { x: worldBefore2.x - px / s2, y: worldBefore2.y - py / s2 };
			const pointerCenter = { x: tl2.x + widthCSS / (2 * s2), y: tl2.y + heightCSS / (2 * s2) };
			if (zClamped < this.deps.getZoom()) {
				const centerScaled = { x: centerNow.x * factor, y: centerNow.y * factor };
				const dz = Math.max(0, this.deps.getZoom() - zClamped);
				const bias = Math.max(0, Math.min(0.6, (this.deps.getOutCenterBias() ?? 0.15) * dz));
				center2 = {
					x: pointerCenter.x * (1 - bias) + centerScaled.x * bias,
					y: pointerCenter.y * (1 - bias) + centerScaled.y * bias,
				};
			} else {
				center2 = pointerCenter;
			}
		}
		center2 = this.deps.clampCenterWorld(center2, zInt2, s2, widthCSS, heightCSS);
		const s2f = Coords.sFor(zImg, zInt2);
		this.deps.setCenterLngLat(center2.x * s2f, center2.y * s2f);
		this.deps.setZoom(zClamped);
		if (DEBUG)
			try {
				console.debug('[center] zoom', { lng: center2.x * s2f, lat: center2.y * s2f, z: zClamped });
			} catch {}
		this.deps.requestRender();
	}
	setOptions(opts: { easeBaseMs?: number; easePerUnitMs?: number; easeMinMs?: number; easeMaxMs?: number }) {
		if (Number.isFinite(opts.easeBaseMs as number)) this.easeBaseMs = Math.max(40, Math.min(600, opts.easeBaseMs as number));
		if (Number.isFinite(opts.easePerUnitMs as number)) this.easePerUnitMs = Math.max(0, Math.min(600, opts.easePerUnitMs as number));
		if (Number.isFinite(opts.easeMinMs as number)) this.easeMinMs = Math.max(20, Math.min(600, opts.easeMinMs as number));
		if (Number.isFinite(opts.easeMaxMs as number)) this.easeMaxMs = Math.max(40, Math.min(1200, opts.easeMaxMs as number));
	}
}
