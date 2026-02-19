/**
 * IconManager -- icon, marker, and decal rendering lifecycle.
 */
import type { MarkerInternal, UpscaleFilterMode, IconScaleFunction, SpriteAtlasDescriptor } from '../../api/types';
import { IconRenderer } from '../layers/icons';

export type IconDefInput = { iconPath: string; x2IconPath?: string; width: number; height: number };

export interface IconManagerDeps {
	getGL(): WebGLRenderingContext;
	debugWarn(msg: string, err?: unknown): void;
	debugLog(msg: string): void;
	requestRender(): void;
	clearScreenCache(): void;
	getMapAtlases?: () => Array<{ url: string; descriptor: SpriteAtlasDescriptor; atlasId: string }>;
}

export class IconManager {
	private deps: IconManagerDeps;
	private _icons: IconRenderer | null = null;
	private _pendingIconDefs: Record<string, IconDefInput> | null = null;
	private _allIconDefs: Record<string, IconDefInput> = {};
	private _pendingMarkers: MarkerInternal[] | null = null;
	private _pendingDecals: MarkerInternal[] | null = null;
	private _lastMarkers: MarkerInternal[] = [];
	private _lastDecals: MarkerInternal[] = [];
	private _spriteAtlases: Array<{ url: string; descriptor: SpriteAtlasDescriptor; atlasId: string }> = [];
	private _maskBuildRequested = false;
	rasterOpacity = 1.0;
	upscaleFilter: UpscaleFilterMode = 'linear';
	iconScaleFunction: IconScaleFunction | null = null;

	constructor(deps: IconManagerDeps) {
		this.deps = deps;
	}

	get icons(): IconRenderer | null {
		return this._icons;
	}

	get lastMarkers(): MarkerInternal[] {
		return this._lastMarkers;
	}

	// -- Init --

	init(): void {
		const gl = this.deps.getGL();
		this._icons = new IconRenderer(gl);

		if (this._pendingIconDefs) {
			const defs = this._pendingIconDefs;
			this._pendingIconDefs = null;
			this.setIconDefs(defs).catch((err) => this.deps.debugWarn('icon init load', err));
		}
		if (this._pendingMarkers && this._pendingMarkers.length) {
			const m = this._pendingMarkers.slice();
			this._pendingMarkers = null;
			this.setMarkers(m);
		}
		if (this._pendingDecals && this._pendingDecals.length) {
			const d = this._pendingDecals.slice();
			this._pendingDecals = null;
			this.setDecals(d);
		}
		// Replay sprite atlas loads queued before GL init
		for (const sa of this._spriteAtlases) {
			this._icons.loadSpriteAtlas(sa.url, sa.descriptor, sa.atlasId).catch((err) => this.deps.debugWarn('sprite atlas init load', err));
		}
		// Load map-level atlases not already in local queue
		const mapAtlases = this.deps.getMapAtlases?.() ?? [];
		const localIds = new Set(this._spriteAtlases.map((sa) => sa.atlasId));
		for (const sa of mapAtlases) {
			if (!localIds.has(sa.atlasId)) {
				this._spriteAtlases.push(sa);
				this._icons.loadSpriteAtlas(sa.url, sa.descriptor, sa.atlasId).catch((err) => this.deps.debugWarn('map atlas init load', err));
			}
		}
	}

	// -- Icon defs --

	async setIconDefs(defs: Record<string, IconDefInput>): Promise<void> {
		for (const k of Object.keys(defs)) this._allIconDefs[k] = defs[k]!;
		if (!this._icons) {
			if (!this._pendingIconDefs) this._pendingIconDefs = {};
			for (const k of Object.keys(defs)) this._pendingIconDefs[k] = defs[k]!;
			return;
		}
		try {
			await this._icons.loadIcons(defs);
		} catch (err) {
			if (typeof console !== 'undefined' && console.warn) {
				console.warn('[GTMap] Icon loading failed:', err);
			}
		}
		this.deps.clearScreenCache();
		this.deps.requestRender();
	}

	// -- Sprite atlas --

	async loadSpriteAtlas(url: string, descriptor: SpriteAtlasDescriptor, atlasId: string): Promise<Record<string, string>> {
		this._spriteAtlases.push({ url, descriptor, atlasId });
		if (!this._icons) {
			return {};
		}
		try {
			const result = await this._icons.loadSpriteAtlas(url, descriptor, atlasId);
			this.deps.clearScreenCache();
			this.deps.requestRender();
			return result;
		} catch (err) {
			if (typeof console !== 'undefined' && console.warn) {
				console.warn('[GTMap] Sprite atlas loading failed:', err);
			}
			return {};
		}
	}

	// -- Markers --

	setMarkers(markers: MarkerInternal[]): void {
		try {
			this._lastMarkers = markers.slice();
		} catch {
			this._lastMarkers = markers;
		}
		if (!this._icons) {
			this._pendingMarkers = markers.slice();
			return;
		}
		this._icons.setMarkers(markers);
		this.deps.debugLog(`setMarkers count=${markers.length}`);
		this.deps.clearScreenCache();
		this.deps.requestRender();
	}

	setDecals(decals: MarkerInternal[]): void {
		try {
			this._lastDecals = decals.slice();
		} catch {
			this._lastDecals = decals;
		}
		if (!this._icons) {
			this._pendingDecals = decals.slice();
			return;
		}
		this._icons.setDecals?.(decals);
		this.deps.debugLog(`setDecals count=${decals.length}`);
		this.deps.clearScreenCache();
		this.deps.requestRender();
	}

	// -- Rendering options --

	setUpscaleFilter(mode: UpscaleFilterMode): void {
		const next = mode === 'linear' || mode === 'bicubic' ? mode : 'auto';
		if (next !== this.upscaleFilter) {
			this.upscaleFilter = next;
			this.deps.clearScreenCache();
			this.deps.requestRender();
		}
	}

	setRasterOpacity(opacity: number): void {
		const v = Math.max(0, Math.min(1, opacity));
		if (v !== this.rasterOpacity) {
			this.rasterOpacity = v;
			this.deps.requestRender();
		}
	}

	setIconScaleFunction(fn: IconScaleFunction | null): void {
		this.iconScaleFunction = fn;
		this.deps.clearScreenCache();
		this.deps.requestRender();
	}

	// -- Mask build --

	requestMaskBuild(): void {
		if (this._maskBuildRequested) return;
		this._maskBuildRequested = true;
		const start = () => {
			try {
				this._icons?.startMaskBuild?.();
			} catch (e) {
				this.deps.debugWarn('mask build', e);
			}
		};
		const w = window as { requestIdleCallback?: (cb: () => void) => number };
		if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(start);
		else setTimeout(start, 0);
	}

	// -- GL resume --

	rebuild(): void {
		try {
			const gl = this.deps.getGL();
			this._icons = new IconRenderer(gl);
			const defs = this._allIconDefs;
			if (defs && Object.keys(defs).length) {
				this._icons.loadIcons(defs).catch((err) => this.deps.debugWarn('icon rebuild load', err));
			}
			// Replay sprite atlas loads (local + map-level)
			const mapAtlases = this.deps.getMapAtlases?.() ?? [];
			const localIds = new Set(this._spriteAtlases.map((sa) => sa.atlasId));
			for (const sa of mapAtlases) {
				if (!localIds.has(sa.atlasId)) this._spriteAtlases.push(sa);
			}
			for (const sa of this._spriteAtlases) {
				this._icons.loadSpriteAtlas(sa.url, sa.descriptor, sa.atlasId).catch((err) => this.deps.debugWarn('sprite atlas rebuild load', err));
			}
			if (this._lastMarkers && this._lastMarkers.length) {
				this._icons.setMarkers(this._lastMarkers);
			}
			if (this._lastDecals && this._lastDecals.length) {
				this._icons.setDecals?.(this._lastDecals);
			}
		} catch (e) {
			this.deps.debugWarn('GL reinit icons', e);
		}
	}

	// -- Lifecycle --

	dispose(): void {
		try {
			this._icons?.dispose?.();
		} catch {
			/* expected: GL context may be lost */
		}
		this._icons = null;
	}
}
