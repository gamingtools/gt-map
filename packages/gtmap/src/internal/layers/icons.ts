import * as Coords from '../coords';
import type { ANGLEInstancedArrays, IconScaleFunction, SpriteAtlasDescriptor } from '../../api/types';
import type { ProgramLocs } from '../render/screen-cache';

import { IconAtlasManager } from './icons/icon-atlas-manager';
import { IconInstanceBuffers } from './icons/icon-instance-buffers';

export type { MarkerRenderData } from './icons/types';
export type { IconMeta } from './icons/types';
import type { MarkerRenderData } from './icons/types';

/**
 * IconRenderer -- orchestrates efficient WebGL rendering of map markers and decals.
 *
 * Delegates atlas/texture management to IconAtlasManager and per-type GPU buffer
 * management to IconInstanceBuffers.  Owns shader compilation, instanced/fallback
 * draw paths, and the public marker API.
 */
export class IconRenderer {
	private gl: WebGLRenderingContext;
	private atlas = new IconAtlasManager();
	private buffers = new IconInstanceBuffers();
	private markers: MarkerRenderData[] = [];
	private decals: MarkerRenderData[] = [];
	private _markerRevision = 0;
	private _markerInfoCache:
		| {
				revision: number;
				mapScale: number;
				zoom: number | undefined;
				minZoom: number | undefined;
				maxZoom: number | undefined;
				data: Array<{
					id: string;
					index: number;
					x: number;
					y: number;
					w: number;
					h: number;
					type: string;
					anchor: { ax: number; ay: number };
					rotation?: number;
					icon: { iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
				}>;
		  }
		| null = null;
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

	constructor(gl: WebGLRenderingContext) {
		this.gl = gl;
	}

	dispose() {
		this.atlas.dispose(this.gl);
		this.buffers.dispose(this.gl);
		try {
			if (this.instProg) this.gl.deleteProgram(this.instProg);
		} catch {
			/* expected: GL context may be lost */
		}
		this.instProg = null;
		this.instLoc = null;
		this.instExt = null;
	}

	// -- Public API (delegates to atlas) --

	async loadIcons(defs: Record<string, { iconPath: string; x2IconPath?: string; canvas?: HTMLCanvasElement; width: number; height: number; anchorX?: number; anchorY?: number }>, opts?: { replaceAll?: boolean }) {
		await this.atlas.loadIcons(this.gl, defs, opts);
		this._markerRevision++;
		this._markerInfoCache = null;
		this.buffers.rebuildTypeData(this.markers, this.decals, this.atlas);
	}

	async loadSpriteAtlas(url: string, descriptor: SpriteAtlasDescriptor, atlasId: string): Promise<Record<string, string>> {
		const ids = await this.atlas.loadSpriteAtlas(this.gl, url, descriptor, atlasId);
		this._markerRevision++;
		this._markerInfoCache = null;
		this.buffers.rebuildTypeData(this.markers, this.decals, this.atlas);
		return ids;
	}

	startMaskBuild() {
		this.atlas.startMaskBuild();
	}

	getMaskInfo(type: string): { data: Uint8Array; w: number; h: number } | null {
		return this.atlas.getMaskInfo(type);
	}

	// -- Marker data --

	setMarkers(
		markers: Array<MarkerRenderData | { x: number; y: number; type: string; size?: number; sizeW?: number; sizeH?: number; rotation?: number; iconScaleFunction?: IconScaleFunction | null }>,
	) {
		let idx = 0;
		const norm: MarkerRenderData[] = [];
		for (const m of markers || []) {
			if ('id' in (m as Record<string, unknown>)) {
				norm.push(m as MarkerRenderData);
			} else {
				const mm = m as { x: number; y: number; type: string; size?: number; sizeW?: number; sizeH?: number; rotation?: number };
				norm.push({
					id: `m${idx++}`,
					x: mm.x,
					y: mm.y,
					type: mm.type,
					...(mm.size !== undefined ? { size: mm.size } : {}),
					...(mm.sizeW !== undefined ? { sizeW: mm.sizeW } : {}),
					...(mm.sizeH !== undefined ? { sizeH: mm.sizeH } : {}),
					...(mm.rotation !== undefined ? { rotation: mm.rotation } : {}),
				});
			}
		}
		this.markers = norm;
		this._markerRevision++;
		this._markerInfoCache = null;
		this.buffers.rebuildTypeData(this.markers, this.decals, this.atlas);
	}

	setDecals(decals: Array<MarkerRenderData | { x: number; y: number; type: string; size?: number; sizeW?: number; sizeH?: number; rotation?: number }>) {
		let idx = 0;
		const norm: MarkerRenderData[] = [];
		for (const d of decals || []) {
			if ('id' in (d as Record<string, unknown>)) {
				norm.push(d as MarkerRenderData);
			} else {
				const dd = d as { x: number; y: number; type: string; size?: number; sizeW?: number; sizeH?: number; rotation?: number };
				norm.push({
					id: `d${idx++}`,
					x: dd.x,
					y: dd.y,
					type: dd.type,
					...(dd.size !== undefined ? { size: dd.size } : {}),
					...(dd.sizeW !== undefined ? { sizeW: dd.sizeW } : {}),
					...(dd.sizeH !== undefined ? { sizeH: dd.sizeH } : {}),
					...(dd.rotation !== undefined ? { rotation: dd.rotation } : {}),
				});
			}
		}
		this.decals = norm;
		this._markerRevision++;
		this._markerInfoCache = null;
		this.buffers.rebuildTypeData(this.markers, this.decals, this.atlas);
	}

	// -- Debug info --

	getMarkerInfo(
		mapScale: number,
		zoomParams?: { zoom: number; minZoom: number; maxZoom: number },
	): Array<{
		id: string;
		index: number;
		x: number;
		y: number;
		w: number;
		h: number;
		type: string;
		anchor: { ax: number; ay: number };
			rotation?: number;
			icon: { iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
		}> {
		const cache = this._markerInfoCache;
		const z = zoomParams?.zoom;
		const minZ = zoomParams?.minZoom;
		const maxZ = zoomParams?.maxZoom;
		if (
			cache &&
			cache.revision === this._markerRevision &&
			cache.mapScale === mapScale &&
			cache.zoom === z &&
			cache.minZoom === minZ &&
			cache.maxZoom === maxZ
		) {
			return cache.data;
		}

		const out: Array<{
			id: string;
			index: number;
			x: number;
			y: number;
			w: number;
			h: number;
			type: string;
			anchor: { ax: number; ay: number };
			rotation?: number;
			icon: { iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
		}> = [];
		let idx = 0;
		for (const m of this.markers) {
			// Compute effective scale: per-marker override > map-level
			let scale = mapScale;
			if (zoomParams && m.iconScaleFunction !== undefined) {
				if (m.iconScaleFunction === null) {
					scale = 1.0;
				} else {
					scale = m.iconScaleFunction(zoomParams.zoom, zoomParams.minZoom, zoomParams.maxZoom);
				}
			}
			const sz = this.atlas.getSize(m.type);
			const hasExplicitSize = m.sizeW != null || m.sizeH != null || m.size != null;
			const w0 = m.sizeW ?? m.size ?? sz.w;
			const h0 = m.sizeH ?? m.size ?? sz.h;
			const w = w0 * scale;
			const h = h0 * scale;
			const origAnchor = this.atlas.getAnchor(m.type);
			const scaleX = hasExplicitSize ? w0 / sz.w : 1;
			const scaleY = hasExplicitSize ? h0 / sz.h : 1;
			const a = { ax: origAnchor.ax * scaleX, ay: origAnchor.ay * scaleY };
			const meta = this.atlas.getMeta(m.type) || { iconPath: '', width: sz.w, height: sz.h, anchorX: origAnchor.ax, anchorY: origAnchor.ay };
			out.push({
				id: m.id,
				index: idx,
				x: m.x,
				y: m.y,
				w,
				h,
				type: m.type,
				anchor: { ax: a.ax * scale, ay: a.ay * scale },
				...(m.rotation !== undefined ? { rotation: m.rotation } : {}),
				icon: meta,
			});
			idx++;
		}
		this._markerInfoCache = { revision: this._markerRevision, mapScale, zoom: z, minZoom: minZ, maxZoom: maxZ, data: out };
		return out;
	}

	// -- Draw --

	draw(ctx: {
		gl: WebGLRenderingContext;
		prog: WebGLProgram;
		loc: ProgramLocs;
		quad: WebGLBuffer;
		canvas: HTMLCanvasElement;
		dpr: number;
		zoom: number;
		center: { x: number; y: number };
		baseZ?: number;
		levelScale?: number;
		tlWorld?: { x: number; y: number };
		minZoom?: number;
		maxZoom?: number;
		container: HTMLElement;
		viewport: { width: number; height: number };
		project: (x: number, y: number, z: number) => { x: number; y: number };
		wrapX: boolean;
		iconScaleFunction?: ((zoom: number, minZoom: number, maxZoom: number) => number) | null;
		drawOverlayAtZ?: (zIndex: number) => void;
		overlayZIndices?: number[];
	}) {
		const hasMarkers = this.markers.length > 0 || this.decals.length > 0;
		if (!hasMarkers) {
			const overlayZs = ctx.overlayZIndices ?? [];
			for (const z of overlayZs) {
				ctx.drawOverlayAtZ?.(z);
			}
			return;
		}
		const gl = ctx.gl;
		const { zInt: fallbackZ, scale: fallbackScale } = Coords.zParts(ctx.zoom);
		const baseZ = ctx.baseZ ?? fallbackZ;
		const effScale = ctx.levelScale ?? fallbackScale;
		const widthCSS = ctx.viewport.width;
		const heightCSS = ctx.viewport.height;
		let tlWorld = ctx.tlWorld;
		if (!tlWorld) {
			const centerLevel = ctx.project(ctx.center.x, ctx.center.y, baseZ);
			tlWorld = Coords.tlLevelForWithScale(centerLevel, effScale, { x: widthCSS, y: heightCSS });
		}

		const minZoom = ctx.minZoom ?? 0;
		const maxZoom = ctx.maxZoom ?? 19;
		const mapIconScale = ctx.iconScaleFunction ? ctx.iconScaleFunction(ctx.zoom, minZoom, maxZoom) : 1.0;

		if (
			this.buffers.hasCustomIconScale &&
			(
				this.buffers.iconScaleDirty ||
				ctx.zoom !== this.buffers.lastBuildZoom ||
				minZoom !== this.buffers.lastBuildMinZoom ||
				maxZoom !== this.buffers.lastBuildMaxZoom ||
				mapIconScale !== this.buffers.lastBuildMapIconScale
			)
		) {
			this.buffers.updateIconScales(ctx.zoom, minZoom, maxZoom, mapIconScale);
		}

		const uniformIconScale = this.buffers.hasCustomIconScale ? 1.0 : mapIconScale;
		const invS = ctx.project(1, 0, baseZ).x - ctx.project(0, 0, baseZ).x;

		if (this.ensureInstanced(gl)) {
			this.drawInstanced(ctx, gl, tlWorld, effScale, invS, uniformIconScale);
			return;
		}

		this.drawFallback(ctx, gl, baseZ, tlWorld, effScale, widthCSS, heightCSS, minZoom, maxZoom, mapIconScale);
	}

	// -- Instanced path --

	private drawInstanced(
		ctx: {
			gl: WebGLRenderingContext;
			quad: WebGLBuffer;
			canvas: HTMLCanvasElement;
			dpr: number;
			zoom: number;
			drawOverlayAtZ?: (zIndex: number) => void;
			overlayZIndices?: number[];
		},
		gl: WebGLRenderingContext,
		tlWorld: { x: number; y: number },
		effScale: number,
		invS: number,
		uniformIconScale: number,
	) {
		gl.useProgram(this.instProg!);
		gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
		gl.enableVertexAttribArray(this.instLoc!.a_pos);
		gl.vertexAttribPointer(this.instLoc!.a_pos, 2, gl.FLOAT, false, 0, 0);
		gl.uniform2f(this.instLoc!.u_resolution, ctx.canvas.width, ctx.canvas.height);
		gl.uniform1i(this.instLoc!.u_tex, 0);
		gl.uniform1f(this.instLoc!.u_alpha, 1.0);
		gl.uniform2f(this.instLoc!.u_tlWorld!, tlWorld.x, tlWorld.y);
		gl.uniform1f(this.instLoc!.u_scale!, effScale);
		gl.uniform1f(this.instLoc!.u_dpr!, ctx.dpr);
		gl.uniform1f(this.instLoc!.u_invS!, invS);
		gl.uniform1f(this.instLoc!.u_iconScale!, uniformIconScale);

		const isGL2 = 'drawArraysInstanced' in (gl as WebGL2RenderingContext);
		const sortedTypes = this.buffers.getSortedTypes(this.markers, this.decals);
		const overlayZs = ctx.overlayZIndices ?? [];
		let overlayIdx = 0;

		for (const type of sortedTypes) {
			const typeMinZ = this.buffers.getTypeMinZ(type);
			while (overlayIdx < overlayZs.length && overlayZs[overlayIdx]! <= typeMinZ) {
				ctx.drawOverlayAtZ?.(overlayZs[overlayIdx]!);
				overlayIdx++;
				// Restore instanced program state after overlay draw
				gl.useProgram(this.instProg!);
				gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
				gl.enableVertexAttribArray(this.instLoc!.a_pos);
				gl.vertexAttribPointer(this.instLoc!.a_pos, 2, gl.FLOAT, false, 0, 0);
			}

			const tex = this.atlas.getTexture(type);
			if (!tex) continue;

			const count = this.buffers.syncBuffer(gl, type);
			if (count == null) continue;

			// Per-instance attributes (32-byte stride)
			gl.enableVertexAttribArray(this.instLoc!.a_i_native);
			gl.vertexAttribPointer(this.instLoc!.a_i_native, 2, gl.FLOAT, false, 32, 0);
			if (isGL2) (gl as WebGL2RenderingContext).vertexAttribDivisor(this.instLoc!.a_i_native, 1);
			else this.instExt!.vertexAttribDivisorANGLE(this.instLoc!.a_i_native, 1);
			gl.enableVertexAttribArray(this.instLoc!.a_i_size);
			gl.vertexAttribPointer(this.instLoc!.a_i_size, 2, gl.FLOAT, false, 32, 8);
			if (isGL2) (gl as WebGL2RenderingContext).vertexAttribDivisor(this.instLoc!.a_i_size, 1);
			else this.instExt!.vertexAttribDivisorANGLE(this.instLoc!.a_i_size, 1);
			gl.enableVertexAttribArray(this.instLoc!.a_i_anchor);
			gl.vertexAttribPointer(this.instLoc!.a_i_anchor, 2, gl.FLOAT, false, 32, 16);
			if (isGL2) (gl as WebGL2RenderingContext).vertexAttribDivisor(this.instLoc!.a_i_anchor, 1);
			else this.instExt!.vertexAttribDivisorANGLE(this.instLoc!.a_i_anchor, 1);
			gl.enableVertexAttribArray(this.instLoc!.a_i_angle);
			gl.vertexAttribPointer(this.instLoc!.a_i_angle, 1, gl.FLOAT, false, 32, 24);
			if (isGL2) (gl as WebGL2RenderingContext).vertexAttribDivisor(this.instLoc!.a_i_angle, 1);
			else this.instExt!.vertexAttribDivisorANGLE(this.instLoc!.a_i_angle, 1);
			gl.enableVertexAttribArray(this.instLoc!.a_i_iconScale);
			gl.vertexAttribPointer(this.instLoc!.a_i_iconScale, 1, gl.FLOAT, false, 32, 28);
			if (isGL2) (gl as WebGL2RenderingContext).vertexAttribDivisor(this.instLoc!.a_i_iconScale, 1);
			else this.instExt!.vertexAttribDivisorANGLE(this.instLoc!.a_i_iconScale, 1);

			gl.bindTexture(gl.TEXTURE_2D, tex);
			const uv = this.atlas.getUV(type);
			gl.uniform2f(this.instLoc!.u_uv0!, uv.u0, uv.v0);
			gl.uniform2f(this.instLoc!.u_uv1!, uv.u1, uv.v1);
			if (isGL2) (gl as WebGL2RenderingContext).drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
			else this.instExt!.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, 4, count);
		}

		while (overlayIdx < overlayZs.length) {
			ctx.drawOverlayAtZ?.(overlayZs[overlayIdx]!);
			overlayIdx++;
		}
	}

	// -- Fallback path (no instancing) --

	private drawFallback(
		ctx: {
			gl: WebGLRenderingContext;
			prog: WebGLProgram;
			loc: ProgramLocs;
			quad: WebGLBuffer;
			canvas: HTMLCanvasElement;
			dpr: number;
			zoom: number;
			center: { x: number; y: number };
			container: HTMLElement;
			viewport: { width: number; height: number };
			project: (x: number, y: number, z: number) => { x: number; y: number };
			drawOverlayAtZ?: (zIndex: number) => void;
			overlayZIndices?: number[];
		},
		gl: WebGLRenderingContext,
		baseZ: number,
		tlWorld: { x: number; y: number },
		effScale: number,
		widthCSS: number,
		heightCSS: number,
		minZoom: number,
		maxZoom: number,
		mapIconScale: number,
	) {
		gl.useProgram(ctx.prog);
		gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
		gl.enableVertexAttribArray(ctx.loc.a_pos);
		gl.vertexAttribPointer(ctx.loc.a_pos, 2, gl.FLOAT, false, 0, 0);
		gl.uniform2f(ctx.loc.u_resolution, ctx.canvas.width, ctx.canvas.height);
		gl.uniform1i(ctx.loc.u_tex, 0);
		gl.uniform1f(ctx.loc.u_alpha, 1.0);

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
			const sz = this.atlas.getSize(type);
			const tex = this.atlas.getTexture(type);
			if (!tex) continue;

			gl.bindTexture(gl.TEXTURE_2D, tex);
			const uv = this.atlas.getUV(type);
			gl.uniform2f(ctx.loc.u_uv0!, uv.u0, uv.v0);
			gl.uniform2f(ctx.loc.u_uv1!, uv.u1, uv.v1);
			for (const m of list) {
				const p = ctx.project(m.x, m.y, baseZ);
				const xCSS = (p.x - tlWorld.x) * effScale;
				const yCSS = (p.y - tlWorld.y) * effScale;
				let markerIconScale: number;
				if (m.iconScaleFunction === null) {
					markerIconScale = 1.0;
				} else if (m.iconScaleFunction !== undefined) {
					markerIconScale = m.iconScaleFunction(ctx.zoom, minZoom, maxZoom);
				} else {
					markerIconScale = mapIconScale;
				}
				const w = (m.sizeW ?? m.size ?? sz.w) * markerIconScale;
				const h = (m.sizeH ?? m.size ?? sz.h) * markerIconScale;

				if (xCSS + w / 2 < 0 || yCSS + h / 2 < 0 || xCSS - w / 2 > widthCSS || yCSS - h / 2 > heightCSS) continue;

				const centerX = Math.round(xCSS * ctx.dpr);
				const centerY = Math.round(yCSS * ctx.dpr);
				const halfW = Math.round((w * ctx.dpr) / 2);
				const halfH = Math.round((h * ctx.dpr) / 2);

				const tx = centerX - halfW;
				const ty = centerY - halfH;
				const tw = halfW * 2;
				const th = halfH * 2;
				gl.uniform2f(ctx.loc.u_translate, tx, ty);
				gl.uniform2f(ctx.loc.u_size, tw, th);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			}
		}
		if (ctx.drawOverlayAtZ && ctx.overlayZIndices) {
			for (const z of ctx.overlayZIndices) {
				ctx.drawOverlayAtZ(z);
			}
		}
	}

	// -- Instancing setup --

	private ensureInstanced(gl: WebGLRenderingContext): boolean {
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
          vec2 basePx = css * u_dpr;
          float effectiveScale = a_i_iconScale * u_iconScale;
          vec2 sizePx = a_i_size * effectiveScale * u_dpr;
          vec2 anchorPx = a_i_anchor * effectiveScale * u_dpr;
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
			} catch {
				/* expected */
			}
			return null;
		}
		const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
		gl.shaderSource(fs, fsSrc);
		gl.compileShader(fs);
		if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
			try {
				console.warn('instanced FS error', gl.getShaderInfoLog(fs));
			} catch {
				/* expected */
			}
			return null;
		}
		const prog = gl.createProgram()!;
		gl.attachShader(prog, vs);
		gl.attachShader(prog, fs);
		gl.linkProgram(prog);
		if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
			try {
				console.warn('instanced link error', gl.getProgramInfoLog(prog));
			} catch {
				/* expected */
			}
			return null;
		}
		return prog;
	}
}
