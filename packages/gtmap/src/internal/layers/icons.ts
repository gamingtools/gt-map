import * as Coords from '../coords';
import type { ANGLEInstancedArrays, IconScaleFunction } from '../../api/types';
import type { ProgramLocs } from '../render/screen-cache';

import { IconMaskBuilder } from './icons/icon-mask-builder';
import { createAtlas } from './icons/icon-atlas';

export type IconDef = { id: string; url: string; width: number; height: number; anchorX?: number; anchorY?: number };
export type MarkerRenderData = {
	id: string;
	lng: number;
	lat: number;
	type: string;
	size?: number;
	rotation?: number;
	zIndex?: number;
	/** Per-marker icon scale function override (undefined = use map's, null = no scaling) */
	iconScaleFunction?: IconScaleFunction | null;
};

/**
 * IconRenderer handles efficient WebGL rendering of map markers and decals.
 *
 * ## Instanced Rendering
 *
 * For performance with many markers, we use WebGL instanced drawing:
 * - A single unit quad (0,0 to 1,1) is drawn multiple times
 * - Per-instance attributes provide position, size, anchor, and rotation
 * - One draw call renders all markers of the same type
 *
 * This is vastly more efficient than individual draw calls, especially
 * when markers number in the hundreds or thousands.
 *
 * ## Texture Atlas
 *
 * Icons are packed into texture atlases to minimize texture binding:
 * - Multiple icon images are combined into one texture
 * - UV coordinates select the correct region for each icon type
 * - Retina (2x) and standard (1x) atlases are maintained separately
 *
 * ## Instance Buffer Layout
 *
 * Each instance uses 7 floats (28 bytes):
 * ```
 * [lng, lat, width, height, anchorX, anchorY, angle]
 *   0    1     2       3        4        5       6
 * ```
 *
 * ## Shader Math
 *
 * The vertex shader transforms from world coordinates to clip space:
 * 1. Convert native coords to level space: `world = native * invS`
 * 2. Convert to CSS pixels: `css = (world - tlWorld) * scale`
 * 3. Quantize to device pixels to eliminate subpixel jitter
 * 4. Apply rotation around anchor point
 * 5. Transform to clip space: `clip = (pixel / resolution) * 2 - 1`
 *
 * ## Rotation
 *
 * Rotation is applied in device pixel space around the anchor point:
 * ```
 * v = vertex * size - anchor  // offset from anchor
 * vr = rotate(v, angle)       // apply rotation
 * pos = center + vr           // final position
 * ```
 */
export class IconRenderer {
	private gl: WebGLRenderingContext;
	private textures = new Map<string, WebGLTexture>();
	private textures2x = new Map<string, WebGLTexture>(); // Retina textures
	private texSize = new Map<string, { w: number; h: number }>();
	private texAnchor = new Map<string, { ax: number; ay: number }>();
	private iconMeta = new Map<string, { iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number }>();
	private maskBuilder = new IconMaskBuilder();
	private markers: MarkerRenderData[] = [];
	private decals: MarkerRenderData[] = [];
	// Texture atlas
	// Atlas bookkeeping kept local in load; we do not need fields on the class.
	private uvRect = new Map<string, { u0: number; v0: number; u1: number; v1: number }>();
	private uvRect2x = new Map<string, { u0: number; v0: number; u1: number; v1: number }>(); // Retina UV rects
	private hasRetina = new Map<string, boolean>(); // Track which icons have retina versions
	// Instancing support
	private instExt: ANGLEInstancedArrays | null = null;
	private instProg: WebGLProgram | null = null;
	private instLoc: {
		a_pos: number;
		a_i_native: number;
		a_i_size: number;
		a_i_anchor: number;
		a_i_angle: number;
		a_i_iconScale: number;
		u_resolution: WebGLUniformLocation | null;
		u_tlWorld: WebGLUniformLocation | null;
		u_scale: WebGLUniformLocation | null;
		u_dpr: WebGLUniformLocation | null;
		u_invS: WebGLUniformLocation | null;
		u_tex: WebGLUniformLocation | null;
		u_alpha: WebGLUniformLocation | null;
		u_uv0: WebGLUniformLocation | null;
		u_uv1: WebGLUniformLocation | null;
		u_iconScale: WebGLUniformLocation | null;
	} | null = null;
	private instBuffers = new Map<string, { buf: WebGLBuffer; count: number; version: number; uploaded: number; capacityBytes: number }>();
	private typeData = new Map<string, { data: Float32Array; version: number }>();
	private typeMinZ = new Map<string, number>(); // Min zIndex per type for draw ordering
	private typeMarkers = new Map<string, MarkerRenderData[]>(); // Markers grouped by type for iconScale updates
	private hasCustomIconScale = false; // Track if any markers have custom iconScaleFunction
	private lastBuildZoom = 0; // Zoom level at which typeData was last built
	private lastBuildMinZoom = 0;
	private lastBuildMaxZoom = 19;

	dispose() {
		const gl = this.gl;
		try {
			// Deduplicate textures to avoid deleting the same atlas more than once
			const unique = new Set<WebGLTexture>();
			for (const t of this.textures.values()) if (t) unique.add(t);
			for (const t of this.textures2x.values()) if (t) unique.add(t);
			for (const tex of unique) {
				try {
					gl.deleteTexture(tex);
				} catch {}
			}
		} catch {}
		try {
			for (const rec of this.instBuffers.values()) {
				try {
					gl.deleteBuffer(rec.buf);
				} catch {}
			}
		} catch {}
		try {
			if (this.instProg) gl.deleteProgram(this.instProg);
		} catch {}
		this.textures.clear();
		this.textures2x.clear();
		this.uvRect.clear();
		this.uvRect2x.clear();
		this.hasRetina.clear();
		this.instBuffers.clear();
		this.typeData.clear();
		this.instProg = null;
		this.instLoc = null;
		this.instExt = null;
	}

	// Expose resolved marker sizes for debug overlays (hitboxes)
	getMarkerInfo(scale = 1): Array<{
		id: string;
		index: number;
		lng: number;
		lat: number;
		w: number;
		h: number;
		type: string;
		anchor: { ax: number; ay: number };
		rotation?: number;
		icon: { iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
	}> {
		const out: Array<{
			id: string;
			index: number;
			lng: number;
			lat: number;
			w: number;
			h: number;
			type: string;
			anchor: { ax: number; ay: number };
			rotation?: number;
			icon: { iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
		}> = [];
		let idx = 0;
		for (const m of this.markers) {
			const sz = this.texSize.get(m.type) || { w: 32, h: 32 };
			const w0 = m.size || sz.w;
			const h0 = m.size || sz.h;
			const w = w0 * scale;
			const h = h0 * scale;
			const origAnchor = this.texAnchor.get(m.type) || { ax: sz.w / 2, ay: sz.h / 2 };
			// Scale anchor per-axis when m.size forces non-square icons to square
			const scaleX = m.size ? m.size / sz.w : 1;
			const scaleY = m.size ? m.size / sz.h : 1;
			const a = { ax: origAnchor.ax * scaleX, ay: origAnchor.ay * scaleY };
			const meta = this.iconMeta.get(m.type) || { iconPath: '', x2IconPath: undefined, width: sz.w, height: sz.h, anchorX: origAnchor.ax, anchorY: origAnchor.ay };
			out.push({ id: m.id, index: idx, lng: m.lng, lat: m.lat, w, h, type: m.type, anchor: { ax: a.ax * scale, ay: a.ay * scale }, rotation: m.rotation, icon: meta });
			idx++;
		}
		return out;
	}

	constructor(gl: WebGLRenderingContext) {
		this.gl = gl;
	}

	/**
	 * Load icon definitions into the renderer.
	 * @param defs - Icon definitions keyed by icon ID
	 * @param opts - Options
	 * @param opts.replaceAll - If true, clears ALL existing icons and atlases before loading.
	 *                          Use this for full theme reloads to prevent memory accumulation.
	 *                          If false (default), new icons are added/updated incrementally
	 *                          but old atlases may accumulate until dispose().
	 */
	async loadIcons(defs: Record<string, { iconPath: string; x2IconPath?: string; width: number; height: number; anchorX?: number; anchorY?: number }>, opts?: { replaceAll?: boolean }) {
		const entries = Object.entries(defs);
		const gl = this.gl;

		// Collect old atlas textures for cleanup if doing a full replace
		let oldAtlases: Set<WebGLTexture> | null = null;
		if (opts?.replaceAll) {
			oldAtlases = new Set<WebGLTexture>();
			for (const t of this.textures.values()) if (t) oldAtlases.add(t);
			for (const t of this.textures2x.values()) if (t) oldAtlases.add(t);
			// Clear all mappings - safe because we're replacing everything
			this.textures.clear();
			this.textures2x.clear();
			this.uvRect.clear();
			this.uvRect2x.clear();
			this.texSize.clear();
			this.texAnchor.clear();
			this.iconMeta.clear();
			this.hasRetina.clear();
			// Reset mask builder to allow fresh mask generation for reloaded icons
			this.maskBuilder.reset();
		}

		// Load both 1x and 2x images for each icon (in parallel)
		const imgs1x: Array<{ key: string; w: number; h: number; src: ImageBitmap | HTMLImageElement }> = [];
		const imgs2x: Array<{ key: string; w: number; h: number; src: ImageBitmap | HTMLImageElement }> = [];

		const loadTasks = entries.map(async ([key, d]) => {
			this.texSize.set(key, { w: d.width, h: d.height });
			this.texAnchor.set(key, { ax: d.anchorX ?? d.width / 2, ay: d.anchorY ?? d.height / 2 });
			this.iconMeta.set(key, { iconPath: d.iconPath, x2IconPath: d.x2IconPath, width: d.width, height: d.height, anchorX: d.anchorX ?? d.width / 2, anchorY: d.anchorY ?? d.height / 2 });

			let src2x: ImageBitmap | HTMLImageElement | null = null;
			if (d.x2IconPath) src2x = await this.loadImageSource(d.x2IconPath);
			if (src2x) {
				imgs2x.push({ key, w: d.width, h: d.height, src: src2x });
				this.hasRetina.set(key, true);
				this.maskBuilder.enqueue(key, src2x, d.width, d.height);
			} else {
				const src1x = await this.loadImageSource(d.iconPath);
				if (src1x) {
					imgs1x.push({ key, w: d.width, h: d.height, src: src1x });
					this.maskBuilder.enqueue(key, src1x, d.width, d.height);
				}
				this.hasRetina.set(key, false);
			}
		});
		await Promise.all(loadTasks);
		// Create 1x atlas
		if (imgs1x.length > 0) {
			const atlas1x = createAtlas(this.gl, imgs1x);
			if (atlas1x) {
				for (const [key, data] of atlas1x) {
					this.textures.set(key, data.tex);
					this.uvRect.set(key, data.uv);
				}
			}
		}

		// Create 2x atlas
		if (imgs2x.length > 0) {
			const atlas2x = createAtlas(this.gl, imgs2x);
			if (atlas2x) {
				for (const [key, data] of atlas2x) {
					this.textures2x.set(key, data.tex);
					this.uvRect2x.set(key, data.uv);
				}
			}
		}

		// Delete old atlases after new ones are created (only for full replace)
		if (oldAtlases) {
			for (const tex of oldAtlases) {
				try {
					gl.deleteTexture(tex);
				} catch {}
			}
			// Trigger mask building for newly loaded icons (since we reset the builder).
			// This is needed even if oldAtlases was empty because mapgl's _maskBuildRequested
			// is a one-time flag that won't retrigger after the first render.
			this.maskBuilder.start();
		}

		// Do not start mask build here for incremental loads; allow map to trigger after first frame
	}

	startMaskBuild() {
		this.maskBuilder.start();
	}

	setMarkers(markers: Array<MarkerRenderData | { lng: number; lat: number; type: string; size?: number; rotation?: number; zIndex?: number }>) {
		// Normalize to internal MarkerRenderData list with ids
		let idx = 0;
		const norm: MarkerRenderData[] = [];
		for (const m of markers || []) {
			if ('id' in (m as Record<string, unknown>)) {
				norm.push(m as MarkerRenderData);
			} else {
				const mm = m as { lng: number; lat: number; type: string; size?: number; rotation?: number; zIndex?: number };
				norm.push({ id: `m${idx++}`, lng: mm.lng, lat: mm.lat, type: mm.type, size: mm.size, rotation: mm.rotation, zIndex: mm.zIndex });
			}
		}
		this.markers = norm;
		// Rebuild combined type data for markers and decals
		this.rebuildTypeData();
	}

	setDecals(decals: Array<MarkerRenderData | { lng: number; lat: number; type: string; size?: number; rotation?: number; zIndex?: number }>) {
		// Normalize to internal MarkerRenderData list with ids
		let idx = 0;
		const norm: MarkerRenderData[] = [];
		for (const d of decals || []) {
			if ('id' in (d as Record<string, unknown>)) {
				norm.push(d as MarkerRenderData);
			} else {
				const dd = d as { lng: number; lat: number; type: string; size?: number; rotation?: number; zIndex?: number };
				norm.push({ id: `d${idx++}`, lng: dd.lng, lat: dd.lat, type: dd.type, size: dd.size, rotation: dd.rotation, zIndex: dd.zIndex });
			}
		}
		this.decals = norm;
		// Prepare per-type instance data for decals (merge with marker data by type)
		// For simplicity, we'll rebuild typeData to include both markers and decals
		this.rebuildTypeData();
	}

	/**
	 * Rebuild per-type instance data arrays for GPU upload.
	 *
	 * ## Data Layout
	 *
	 * Groups all markers by icon type and packs their data into Float32Arrays:
	 * ```
	 * [lng, lat, width, height, anchorX, anchorY, angle] x N instances
	 *   0    1     2       3        4        5       6
	 * ```
	 *
	 * Each instance = 7 floats = 28 bytes.
	 *
	 * ## Versioning
	 *
	 * A version counter tracks when data changes, allowing the GPU buffer
	 * upload to skip unchanged types (avoiding redundant uploads).
	 *
	 * ## Markers + Decals
	 *
	 * Both markers and decals are combined into the same type buckets,
	 * so a single draw call renders all icons of a given type regardless
	 * of whether they're interactive markers or background decals.
	 */
	private rebuildTypeData() {
		// Combine markers and decals for rendering
		const all = [...this.markers, ...this.decals];

		// Sort by zIndex (lower values render first, appear behind higher values)
		all.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

		const byType = new Map<string, MarkerRenderData[]>();
		let hasCustom = false;
		for (const m of all) {
			let arr = byType.get(m.type);
			if (!arr) {
				arr = [];
				byType.set(m.type, arr);
			}
			arr.push(m);
			if (m.iconScaleFunction !== undefined) hasCustom = true;
		}
		this.hasCustomIconScale = hasCustom;
		this.typeMarkers = byType;

		// Clear and rebuild type data with min zIndex tracking
		// 8 floats per instance: x, y, w, h, ax, ay, angle, iconScale
		this.typeMinZ.clear();
		const zoom = this.lastBuildZoom;
		const minZoom = this.lastBuildMinZoom;
		const maxZoom = this.lastBuildMaxZoom;

		for (const [type, list] of byType) {
			const sz = this.texSize.get(type) || { w: 32, h: 32 };
			const anc = this.texAnchor.get(type) || { ax: sz.w / 2, ay: sz.h / 2 };
			const data = new Float32Array(list.length * 8);
			let j = 0;
			let minZ = Infinity;
			for (const m of list) {
				const w = m.size || sz.w;
				const h = m.size || sz.h;
				// Scale anchor per-axis when m.size forces non-square icons to square
				const scaleX = m.size ? m.size / sz.w : 1;
				const scaleY = m.size ? m.size / sz.h : 1;
				const ax = anc.ax * scaleX;
				const ay = anc.ay * scaleY;
				// Compute per-instance iconScale: marker's function if set, else 1.0 (map's applied via uniform)
				let iconScale = 1.0;
				if (m.iconScaleFunction === null) {
					iconScale = 1.0; // Explicitly disabled scaling
				} else if (m.iconScaleFunction !== undefined) {
					iconScale = m.iconScaleFunction(zoom, minZoom, maxZoom);
				}
				// If no custom function, iconScale=1.0 and map's uniform will apply
				data[j++] = m.lng; // native x
				data[j++] = m.lat; // native y
				data[j++] = w;
				data[j++] = h;
				data[j++] = ax;
				data[j++] = ay;
				data[j++] = (m.rotation || 0) * (Math.PI / 180);
				data[j++] = iconScale;
				const z = m.zIndex ?? 0;
				if (z < minZ) minZ = z;
			}
			const prev = this.typeData.get(type);
			const version = (prev?.version || 0) + 1;
			this.typeData.set(type, { data, version });
			this.typeMinZ.set(type, minZ);
		}
	}

	getMaskInfo(type: string): { data: Uint8Array; w: number; h: number } | null {
		return this.maskBuilder.getMaskInfo(type);
	}

	/**
	 * Update iconScale values in typeData when zoom changes.
	 * Only needed if any markers have custom iconScaleFunction.
	 * @param mapIconScale - The computed scale from the map's iconScaleFunction (or 1.0)
	 */
	private updateIconScales(zoom: number, minZoom: number, maxZoom: number, mapIconScale: number) {
		if (!this.hasCustomIconScale) return;
		// Update each type's iconScale values
		for (const [type, list] of this.typeMarkers) {
			const td = this.typeData.get(type);
			if (!td) continue;
			const data = td.data;
			// iconScale is at offset 7 in each 8-float block
			for (let i = 0; i < list.length; i++) {
				const m = list[i];
				let iconScale: number;
				if (m.iconScaleFunction === null) {
					// Explicitly disabled - no scaling
					iconScale = 1.0;
				} else if (m.iconScaleFunction !== undefined) {
					// Custom function - use it directly
					iconScale = m.iconScaleFunction(zoom, minZoom, maxZoom);
				} else {
					// No custom function - use map's scale
					iconScale = mapIconScale;
				}
				data[i * 8 + 7] = iconScale;
			}
			// Increment version to trigger buffer re-upload
			td.version++;
		}
		this.lastBuildZoom = zoom;
		this.lastBuildMinZoom = minZoom;
		this.lastBuildMaxZoom = maxZoom;
	}

	private async loadImageSource(url: string): Promise<ImageBitmap | HTMLImageElement | null> {
		// Try fetch + createImageBitmap, fallback to Image element
		if (typeof fetch === 'function' && typeof createImageBitmap === 'function') {
			try {
				const r = await fetch(url, { mode: 'cors', credentials: 'omit' });
				if (!r.ok) throw new Error(`HTTP ${r.status}`);
				const blob = await r.blob();
				const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
				return bmp;
			} catch (err) {
				// Fallback to Image element; fetch+createImageBitmap failed
				if (typeof console !== 'undefined' && console.debug) {
					console.debug('[icons] fetch+createImageBitmap failed for:', url, err);
				}
			}
		}
		try {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			// decoding is supported in modern browsers
			(img as HTMLImageElement & { decoding?: 'async' | 'sync' | 'auto' }).decoding = 'async';
			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () => reject(new Error('icon load failed'));
				img.src = url;
			});
			return img;
		} catch (err) {
			// Both fetch and Image element failed
			if (typeof console !== 'undefined' && console.warn) {
				console.warn('[icons] Failed to load icon:', url, err);
			}
			return null;
		}
	}

	/**
	 * Draw all markers and decals to the WebGL context.
	 *
	 * ## Rendering Strategy
	 *
	 * 1. **Try instanced path first**: If WebGL2 or ANGLE_instanced_arrays
	 *    is available, use instanced rendering for maximum performance.
	 *
	 * 2. **Fallback to per-marker draws**: For older WebGL1 contexts without
	 *    instancing, fall back to individual draw calls (slower but compatible).
	 *
	 * ## Batching
	 *
	 * Markers are grouped by icon type to minimize texture binds:
	 * - All markers of type "pin" are drawn together
	 * - Then all markers of type "star", etc.
	 *
	 * ## Coordinate Flow
	 *
	 * 1. Compute top-left of viewport in level space (snapped to device pixels)
	 * 2. For each marker, convert world coords -> CSS -> device pixels
	 * 3. Apply anchor offset and rotation
	 * 4. Quantize final position to eliminate subpixel jitter
	 *
	 * ## Device Pixel Snapping
	 *
	 * All positions are snapped to integer device pixels to prevent:
	 * - Texture filtering artifacts (blurry icons)
	 * - Subpixel shimmer during pan
	 * - Inconsistent icon sizes
	 */
	draw(ctx: {
		gl: WebGLRenderingContext;
		prog: WebGLProgram;
		loc: ProgramLocs;
		quad: WebGLBuffer;
		canvas: HTMLCanvasElement;
		dpr: number;
		zoom: number;
		center: { lng: number; lat: number };
		minZoom?: number;
		maxZoom?: number;
		container: HTMLElement;
		viewport: { width: number; height: number };
		project: (x: number, y: number, z: number) => { x: number; y: number };
		wrapX: boolean;
		iconScaleFunction?: ((zoom: number, minZoom: number, maxZoom: number) => number) | null;
		/** Callback to draw overlays at a specific z-index boundary */
		drawOverlayAtZ?: (zIndex: number) => void;
		/** Z-indices at which to call the overlay callback (sorted ascending) */
		overlayZIndices?: number[];
	}) {
		const hasMarkers = this.markers.length > 0 || this.decals.length > 0;
		// Draw overlays even when no markers (for independent vector visibility)
		if (!hasMarkers) {
			// Just draw all overlays and return
			const overlayZs = ctx.overlayZIndices ?? [];
			for (const z of overlayZs) {
				ctx.drawOverlayAtZ?.(z);
			}
			return;
		}
		const gl = ctx.gl;
		const { zInt: baseZ, scale: effScale } = Coords.zParts(ctx.zoom);
		const widthCSS = ctx.viewport.width;
		const heightCSS = ctx.viewport.height;
		const centerLevel = ctx.project(ctx.center.lng, ctx.center.lat, baseZ);
		// Always snap top-left to device pixels to share the same stable origin as the raster
		// and quantize icon positions/sizes in device space to eliminate subpixel jitter.
		let tlWorld = Coords.tlLevelFor(centerLevel, ctx.zoom, { x: widthCSS, y: heightCSS });
		const snapTL = (v: number) => Coords.snapLevelToDevice(v, effScale, ctx.dpr);
		tlWorld = { x: snapTL(tlWorld.x), y: snapTL(tlWorld.y) };

		// Calculate map-level icon scale
		const minZoom = ctx.minZoom ?? 0;
		const maxZoom = ctx.maxZoom ?? 19;
		const mapIconScale = ctx.iconScaleFunction ? ctx.iconScaleFunction(ctx.zoom, minZoom, maxZoom) : 1.0;

		// Update per-instance iconScale values if zoom changed and any markers have custom scale functions
		if (this.hasCustomIconScale && ctx.zoom !== this.lastBuildZoom) {
			this.updateIconScales(ctx.zoom, minZoom, maxZoom, mapIconScale);
		}

		// Determine uniform iconScale:
		// - If markers have custom functions, they're baked into per-instance data, uniform=1.0
		// - If no custom functions, per-instance data is all 1.0, uniform=mapIconScale
		const uniformIconScale = this.hasCustomIconScale ? 1.0 : mapIconScale;
		// Compute map scissor in device pixels to clip icons outside the finite image
		// Icons themselves are not clipped here; screen cache draw is clipped to map extent in renderer.

		// Try instanced path first
		const invS = ctx.project(1, 0, baseZ).x - ctx.project(0, 0, baseZ).x;
		if (this.ensureInstanced(gl)) {
			gl.useProgram(this.instProg!);
			// bind unit quad
			gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
			gl.enableVertexAttribArray(this.instLoc!.a_pos);
			gl.vertexAttribPointer(this.instLoc!.a_pos, 2, gl.FLOAT, false, 0, 0);
			gl.uniform2f(this.instLoc!.u_resolution, ctx.canvas.width, ctx.canvas.height);
			gl.uniform1i(this.instLoc!.u_tex, 0);
			gl.uniform1f(this.instLoc!.u_alpha, 1.0);
			// UVs set per type when using atlas
			gl.uniform2f(this.instLoc!.u_tlWorld!, tlWorld.x, tlWorld.y);
			gl.uniform1f(this.instLoc!.u_scale!, effScale);
			gl.uniform1f(this.instLoc!.u_dpr!, ctx.dpr);
			gl.uniform1f(this.instLoc!.u_invS!, invS);
			gl.uniform1f(this.instLoc!.u_iconScale!, uniformIconScale);

			// For each type, sorted by minZ for proper z-ordering with overlays
			const isGL2 = 'drawArraysInstanced' in (gl as WebGL2RenderingContext);
			const seen = new Set<string>();
			for (const m of this.markers) {
				seen.add(m.type);
			}
			for (const d of this.decals) {
				seen.add(d.type);
			}
			// Sort types by their minimum zIndex
			const sortedTypes = Array.from(seen).sort((a, b) => (this.typeMinZ.get(a) ?? 0) - (this.typeMinZ.get(b) ?? 0));
			// Track which overlay z-indices have been drawn
			const overlayZs = ctx.overlayZIndices ?? [];
			let overlayIdx = 0;
			for (const type of sortedTypes) {
				const typeMinZ = this.typeMinZ.get(type) ?? 0;
				// Draw any overlays that should appear before this type
				while (overlayIdx < overlayZs.length && overlayZs[overlayIdx] <= typeMinZ) {
					ctx.drawOverlayAtZ?.(overlayZs[overlayIdx]);
					overlayIdx++;
					// Restore instanced program state after overlay draw (overlay uses its own program)
					gl.useProgram(this.instProg!);
					gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
					gl.enableVertexAttribArray(this.instLoc!.a_pos);
					gl.vertexAttribPointer(this.instLoc!.a_pos, 2, gl.FLOAT, false, 0, 0);
				}
				// Use retina if available, otherwise fallback to regular
				const useRetina = this.hasRetina.get(type);

				const tex = useRetina && this.textures2x.has(type) ? this.textures2x.get(type) : this.textures.get(type);
				const td = this.typeData.get(type);

				if (!tex || !td) continue;
				let rec = this.instBuffers.get(type);
				const byteLen = td.data.byteLength;
				if (!rec) {
					const buf = gl.createBuffer()!;
					const capacityBytes = roundCapacity(byteLen);
					gl.bindBuffer(gl.ARRAY_BUFFER, buf);
					gl.bufferData(gl.ARRAY_BUFFER, capacityBytes, gl.DYNAMIC_DRAW);
					gl.bufferSubData(gl.ARRAY_BUFFER, 0, td.data);
					rec = { buf, count: td.data.length / 8, version: td.version, uploaded: td.version, capacityBytes };
					this.instBuffers.set(type, rec);
				} else if (rec.uploaded !== td.version) {
					gl.bindBuffer(gl.ARRAY_BUFFER, rec.buf);
					const LARGE_BYTES = 1 << 20; // 1MB
					const prevCount = Math.max(1, rec.count);
					// 8 floats per instance (x,y,w,h,ax,ay,angle,iconScale)
					const newCount = td.data.length / 8;
					const deltaRatio = Math.abs(newCount - prevCount) / prevCount;
					const needResize = byteLen > rec.capacityBytes;
					const shouldOrphan = needResize || byteLen >= LARGE_BYTES || deltaRatio >= 0.25;
					if (shouldOrphan) {
						const newCap = needResize ? roundCapacity(byteLen) : rec.capacityBytes;
						gl.bufferData(gl.ARRAY_BUFFER, newCap, gl.DYNAMIC_DRAW); // orphan
						gl.bufferSubData(gl.ARRAY_BUFFER, 0, td.data);
						rec.capacityBytes = newCap;
					} else {
						gl.bufferSubData(gl.ARRAY_BUFFER, 0, td.data);
					}
					rec.count = newCount;
					rec.uploaded = td.version;
				} else {
					gl.bindBuffer(gl.ARRAY_BUFFER, rec.buf);
				}
				// Per-instance attributes
				gl.enableVertexAttribArray(this.instLoc!.a_i_native);
				gl.vertexAttribPointer(this.instLoc!.a_i_native, 2, gl.FLOAT, false, 32, 0);
				if (isGL2) (gl as WebGL2RenderingContext).vertexAttribDivisor(this.instLoc!.a_i_native, 1);
				else this.instExt!.vertexAttribDivisorANGLE(this.instLoc!.a_i_native, 1);
				gl.enableVertexAttribArray(this.instLoc!.a_i_size);
				gl.vertexAttribPointer(this.instLoc!.a_i_size, 2, gl.FLOAT, false, 32, 8);
				if (isGL2) (gl as WebGL2RenderingContext).vertexAttribDivisor(this.instLoc!.a_i_size, 1);
				else this.instExt!.vertexAttribDivisorANGLE(this.instLoc!.a_i_size, 1);
				// anchor
				gl.enableVertexAttribArray(this.instLoc!.a_i_anchor);
				gl.vertexAttribPointer(this.instLoc!.a_i_anchor, 2, gl.FLOAT, false, 32, 16);
				if (isGL2) (gl as WebGL2RenderingContext).vertexAttribDivisor(this.instLoc!.a_i_anchor, 1);
				else this.instExt!.vertexAttribDivisorANGLE(this.instLoc!.a_i_anchor, 1);
				// angle
				gl.enableVertexAttribArray(this.instLoc!.a_i_angle);
				gl.vertexAttribPointer(this.instLoc!.a_i_angle, 1, gl.FLOAT, false, 32, 24);
				if (isGL2) (gl as WebGL2RenderingContext).vertexAttribDivisor(this.instLoc!.a_i_angle, 1);
				else this.instExt!.vertexAttribDivisorANGLE(this.instLoc!.a_i_angle, 1);
				// iconScale (per-instance)
				gl.enableVertexAttribArray(this.instLoc!.a_i_iconScale);
				gl.vertexAttribPointer(this.instLoc!.a_i_iconScale, 1, gl.FLOAT, false, 32, 28);
				if (isGL2) (gl as WebGL2RenderingContext).vertexAttribDivisor(this.instLoc!.a_i_iconScale, 1);
				else this.instExt!.vertexAttribDivisorANGLE(this.instLoc!.a_i_iconScale, 1);
				gl.bindTexture(gl.TEXTURE_2D, tex);
				// Set UVs based on atlas packing (use retina UVs if using retina texture)
				const uv = useRetina && this.uvRect2x.has(type) ? this.uvRect2x.get(type)! : this.uvRect.get(type) || { u0: 0, v0: 0, u1: 1, v1: 1 };
				gl.uniform2f(this.instLoc!.u_uv0!, uv.u0, uv.v0);
				gl.uniform2f(this.instLoc!.u_uv1!, uv.u1, uv.v1);
				if (isGL2) (gl as WebGL2RenderingContext).drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, rec.count);
				else this.instExt!.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, 4, rec.count);
			}
			// Draw any remaining overlays after all marker types
			while (overlayIdx < overlayZs.length) {
				ctx.drawOverlayAtZ?.(overlayZs[overlayIdx]);
				overlayIdx++;
				// No need to restore state here since we're done drawing markers
			}
			return;
		}

		gl.useProgram(ctx.prog);
		gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
		gl.enableVertexAttribArray(ctx.loc.a_pos);
		gl.vertexAttribPointer(ctx.loc.a_pos, 2, gl.FLOAT, false, 0, 0);
		gl.uniform2f(ctx.loc.u_resolution, ctx.canvas.width, ctx.canvas.height);
		gl.uniform1i(ctx.loc.u_tex, 0);
		gl.uniform1f(ctx.loc.u_alpha, 1.0);
		// UVs set per type if atlas

		// Group markers and decals by type to minimize texture binds
		const groups = new Map<string, MarkerRenderData[]>();
		for (const m of this.markers) {
			if (!groups.has(m.type)) groups.set(m.type, []);
			groups.get(m.type)!.push(m);
		}
		for (const d of this.decals) {
			if (!groups.has(d.type)) groups.set(d.type, []);
			groups.get(d.type)!.push(d);
		}

		for (const [type, list] of groups) {
			const sz = this.texSize.get(type);
			if (!sz) continue;

			// Use retina if available, otherwise fallback to regular
			const useRetina = this.hasRetina.get(type);

			const tex = useRetina && this.textures2x.has(type) ? this.textures2x.get(type) : this.textures.get(type);
			if (!tex) continue;

			gl.bindTexture(gl.TEXTURE_2D, tex);
			const uv = useRetina && this.uvRect2x.has(type) ? this.uvRect2x.get(type)! : this.uvRect.get(type) || { u0: 0, v0: 0, u1: 1, v1: 1 };
			gl.uniform2f(ctx.loc.u_uv0!, uv.u0, uv.v0);
			gl.uniform2f(ctx.loc.u_uv1!, uv.u1, uv.v1);
			for (const m of list) {
				const p = ctx.project(m.lng, m.lat, baseZ);
				const xCSS = (p.x - tlWorld.x) * effScale;
				const yCSS = (p.y - tlWorld.y) * effScale;
				// Compute per-marker iconScale
				let markerIconScale: number;
				if (m.iconScaleFunction === null) {
					markerIconScale = 1.0;
				} else if (m.iconScaleFunction !== undefined) {
					markerIconScale = m.iconScaleFunction(ctx.zoom, minZoom, maxZoom);
				} else {
					markerIconScale = mapIconScale;
				}
				const w = (m.size || sz.w) * markerIconScale;
				const h = (m.size || sz.h) * markerIconScale;

				// Frustum cull before adjusting for centering
				if (xCSS + w / 2 < 0 || yCSS + h / 2 < 0 || xCSS - w / 2 > widthCSS || yCSS - h / 2 > heightCSS) continue;

				// Calculate pixel position with centering and quantize to device pixels
				const centerX = Math.round(xCSS * ctx.dpr);
				const centerY = Math.round(yCSS * ctx.dpr);
				const halfW = Math.round((w * ctx.dpr) / 2);
				const halfH = Math.round((h * ctx.dpr) / 2);

				const tx = centerX - halfW;
				const ty = centerY - halfH;
				const tw = halfW * 2; // Use doubled half-width to maintain consistency
				const th = halfH * 2;
				gl.uniform2f(ctx.loc.u_translate, tx, ty);
				gl.uniform2f(ctx.loc.u_size, tw, th);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			}
			// no scissor state changes here
		}
		// Draw any overlays (fallback path - draw all at end)
		if (ctx.drawOverlayAtZ && ctx.overlayZIndices) {
			for (const z of ctx.overlayZIndices) {
				ctx.drawOverlayAtZ(z);
			}
		}
	}

	/**
	 * Ensure instanced rendering is available and set up.
	 *
	 * ## WebGL Version Handling
	 *
	 * - **WebGL2**: Instancing is native via `drawArraysInstanced()`
	 * - **WebGL1**: Requires `ANGLE_instanced_arrays` extension
	 *
	 * ## Shader Program
	 *
	 * Creates a specialized instancing shader with:
	 * - `a_pos`: Unit quad vertex position (0-1)
	 * - `a_i_native`: Per-instance world position (lng, lat)
	 * - `a_i_size`: Per-instance icon size (width, height)
	 * - `a_i_anchor`: Per-instance anchor offset
	 * - `a_i_angle`: Per-instance rotation angle (radians)
	 *
	 * @returns true if instancing is available and ready
	 */
	private ensureInstanced(gl: WebGLRenderingContext): boolean {
		// WebGL2 supports instancing natively; WebGL1 requires ANGLE_instanced_arrays
		const isGL2 = 'drawArraysInstanced' in (gl as WebGL2RenderingContext);
		if (!isGL2 && !this.instExt) {
			try {
				this.instExt = (gl.getExtension('ANGLE_instanced_arrays') as ANGLEInstancedArrays | null) || null;
			} catch {
				this.instExt = null;
			}
		}
		if (!isGL2 && !this.instExt) return false;
		if (!this.instProg) {
			const vs = `
        attribute vec2 a_pos;
        attribute vec2 a_i_native;
        attribute vec2 a_i_size;
        attribute vec2 a_i_anchor;
        attribute float a_i_angle;
        attribute float a_i_iconScale;
        uniform vec2 u_resolution;
        uniform vec2 u_tlWorld;
        uniform float u_scale;
        uniform float u_dpr;
        uniform float u_invS;
        uniform float u_iconScale;
        varying vec2 v_uv;
        void main(){
          vec2 world = a_i_native * u_invS;
          vec2 css = (world - u_tlWorld) * u_scale;
          // Quantize center and size to device pixels to eliminate subpixel jitter
          vec2 basePx = floor(css * u_dpr + 0.5);
          // Per-instance iconScale multiplied by uniform (uniform=1 when per-instance is used)
          float effectiveScale = a_i_iconScale * u_iconScale;
          vec2 sizePx = a_i_size * effectiveScale * u_dpr;
          vec2 anchorPx = a_i_anchor * effectiveScale * u_dpr;
          // Round size and anchor to integer pixels
          sizePx = floor(sizePx + 0.5);
          anchorPx = floor(anchorPx + 0.5);
          vec2 v = a_pos * sizePx - anchorPx;
          float ang = a_i_angle;
          float s = sin(ang), c = cos(ang);
          vec2 vr = vec2(v.x * c - v.y * s, v.x * s + v.y * c);
          vec2 pixelPos = basePx + vr;
          vec2 clip = (pixelPos / u_resolution) * 2.0 - 1.0;
          clip.y *= -1.0;
          gl_Position = vec4(clip, 0.0, 1.0);
          v_uv = a_pos;
        }
      `;
			const fs = `
        precision highp float;
        varying vec2 v_uv;
        uniform sampler2D u_tex;
        uniform float u_alpha;
        uniform vec2 u_uv0; uniform vec2 u_uv1;
        void main(){
          vec2 uv = mix(u_uv0, u_uv1, v_uv);
          vec4 c = texture2D(u_tex, uv);
          gl_FragColor = vec4(c.rgb, c.a * u_alpha);
        }
      `;
			const prog = this.createProgram(gl, vs, fs);
			if (!prog) return false;
			this.instProg = prog;
			this.instLoc = {
				a_pos: gl.getAttribLocation(prog, 'a_pos'),
				a_i_native: gl.getAttribLocation(prog, 'a_i_native'),
				a_i_size: gl.getAttribLocation(prog, 'a_i_size'),
				a_i_anchor: gl.getAttribLocation(prog, 'a_i_anchor'),
				a_i_angle: gl.getAttribLocation(prog, 'a_i_angle'),
				a_i_iconScale: gl.getAttribLocation(prog, 'a_i_iconScale'),
				u_resolution: gl.getUniformLocation(prog, 'u_resolution'),
				u_tlWorld: gl.getUniformLocation(prog, 'u_tlWorld'),
				u_scale: gl.getUniformLocation(prog, 'u_scale'),
				u_dpr: gl.getUniformLocation(prog, 'u_dpr'),
				u_invS: gl.getUniformLocation(prog, 'u_invS'),
				u_tex: gl.getUniformLocation(prog, 'u_tex'),
				u_alpha: gl.getUniformLocation(prog, 'u_alpha'),
				u_uv0: gl.getUniformLocation(prog, 'u_uv0'),
				u_uv1: gl.getUniformLocation(prog, 'u_uv1'),
				u_iconScale: gl.getUniformLocation(prog, 'u_iconScale'),
			};
		}
		return !!this.instProg;
	}

	private createProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string): WebGLProgram | null {
		const vs = gl.createShader(gl.VERTEX_SHADER)!;
		gl.shaderSource(vs, vsSrc);
		gl.compileShader(vs);
		if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
			try {
				console.warn('instanced VS error', gl.getShaderInfoLog(vs));
			} catch {}
			return null;
		}
		const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
		gl.shaderSource(fs, fsSrc);
		gl.compileShader(fs);
		if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
			try {
				console.warn('instanced FS error', gl.getShaderInfoLog(fs));
			} catch {}
			return null;
		}
		const prog = gl.createProgram()!;
		gl.attachShader(prog, vs);
		gl.attachShader(prog, fs);
		gl.linkProgram(prog);
		if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
			try {
				console.warn('instanced link error', gl.getProgramInfoLog(prog));
			} catch {}
			return null;
		}
		return prog;
	}
}

/**
 * Round buffer capacity up to a power-of-two with 1.5x headroom.
 *
 * This strategy reduces buffer reallocations by:
 * 1. Adding 50% headroom to accommodate growth
 * 2. Rounding to power-of-two for GPU-friendly allocation
 *
 * @param n - Minimum required bytes
 * @returns Capacity in bytes (power of two >= n * 1.5)
 */
function roundCapacity(n: number): number {
	const target = Math.floor(n * 1.5);
	let p = 1;
	while (p < target) p <<= 1;
	return p;
}
