import * as Coords from '../coords';

export type IconDef = { id: string; url: string; width: number; height: number };
export type Marker = { lng: number; lat: number; type: string; size?: number };

export class IconRenderer {
	private gl: WebGLRenderingContext;
	private textures = new Map<string, WebGLTexture>();
	private texSize = new Map<string, { w: number; h: number }>();
	private markers: Marker[] = [];
	// Texture atlas
	// Atlas bookkeeping kept local in load; we do not need fields on the class.
	private uvRect = new Map<string, { u0: number; v0: number; u1: number; v1: number }>();
	// Instancing support
	private instExt: any | null = null;
	private instProg: WebGLProgram | null = null;
	private instLoc: {
		a_pos: number;
		a_i_native: number;
		a_i_size: number;
		u_resolution: WebGLUniformLocation | null;
		u_tlWorld: WebGLUniformLocation | null;
		u_scale: WebGLUniformLocation | null;
		u_dpr: WebGLUniformLocation | null;
		u_invS: WebGLUniformLocation | null;
		u_tex: WebGLUniformLocation | null;
		u_alpha: WebGLUniformLocation | null;
		u_uv0: WebGLUniformLocation | null;
		u_uv1: WebGLUniformLocation | null;
	} | null = null;
	private instBuffers = new Map<string, { buf: WebGLBuffer; count: number; version: number; uploaded: number; capacityBytes: number }>();
	private typeData = new Map<string, { data: Float32Array; version: number }>();

	constructor(gl: WebGLRenderingContext) {
		this.gl = gl;
	}

	async loadIcons(defs: Record<string, { iconPath: string; x2IconPath?: string; width: number; height: number }>) {
		const useX2 = typeof devicePixelRatio !== 'undefined' && devicePixelRatio >= 1.75;
		const entries = Object.entries(defs);
		// Load all images first for atlas packing
		const imgs: Array<{ key: string; w: number; h: number; src: any }> = [];
		for (const [key, d] of entries) {
			this.texSize.set(key, { w: d.width, h: d.height });
			const url = useX2 && d.x2IconPath ? d.x2IconPath : d.iconPath;
			const src = await this.loadImageSource(url);
			if (src) imgs.push({ key, w: d.width, h: d.height, src });
		}
		// Pack into a single atlas (simple shelf pack)
		const MAX_W = 2048;
		let x = 0,
			y = 0,
			rowH = 0,
			atlasW = 0,
			atlasH = 0;
		// Sort by height descending for better packing
		imgs.sort((a, b) => b.h - a.h);
		const pos: Record<string, { x: number; y: number; w: number; h: number }> = {} as any;
		for (const img of imgs) {
			if (img.w > MAX_W) {
				continue;
			}
			if (x + img.w > MAX_W) {
				x = 0;
				y += rowH;
				rowH = 0;
			}
			pos[img.key] = { x, y, w: img.w, h: img.h };
			x += img.w;
			rowH = Math.max(rowH, img.h);
			atlasW = Math.max(atlasW, x);
			atlasH = Math.max(atlasH, y + rowH);
		}
		// Create canvas and draw
		const canvas = document.createElement('canvas');
		canvas.width = atlasW || 1;
		canvas.height = atlasH || 1;
		const ctx2d = canvas.getContext('2d')!;
		ctx2d.clearRect(0, 0, canvas.width, canvas.height);
		for (const img of imgs) {
			const p = pos[img.key];
			if (!p) continue;
			try {
				ctx2d.drawImage(img.src, 0, 0, (img.src as any).width, (img.src as any).height, p.x, p.y, p.w, p.h);
			} catch {}
		}
		// Upload atlas texture
		const gl = this.gl;
		const tex = gl.createTexture();
		if (tex) {
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
			gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas as any);
			// Fill uv rects and assign same atlas texture for each key
			for (const img of imgs) {
				const p = pos[img.key];
				if (!p) continue;
				const u0 = p.x / atlasW,
					v0 = p.y / atlasH,
					u1 = (p.x + p.w) / atlasW,
					v1 = (p.y + p.h) / atlasH;
				this.uvRect.set(img.key, { u0, v0, u1, v1 });
				this.textures.set(img.key, tex);
			}
		}
	}

	setMarkers(markers: Marker[]) {
		this.markers = markers || [];
		// Prepare per-type instance data for instanced path
		const byType = new Map<string, Marker[]>();
		for (const m of this.markers) {
			let arr = byType.get(m.type);
			if (!arr) {
				arr = [];
				byType.set(m.type, arr);
			}
			arr.push(m);
		}
		for (const [type, list] of byType) {
			const sz = this.texSize.get(type) || { w: 32, h: 32 };
			const data = new Float32Array(list.length * 4);
			let j = 0;
			for (const m of list) {
				data[j++] = m.lng; // native x
				data[j++] = m.lat; // native y
				data[j++] = m.size || sz.w;
				data[j++] = m.size || sz.h;
			}
			const prev = this.typeData.get(type);
			const version = (prev?.version || 0) + 1;
			this.typeData.set(type, { data, version });
		}
	}

	private async loadImageSource(url: string): Promise<any | null> {
		// Try fetch + createImageBitmap, fallback to Image element
		if (typeof fetch === 'function' && typeof createImageBitmap === 'function') {
			try {
				const r = await fetch(url, { mode: 'cors', credentials: 'omit' } as any);
				if (!r.ok) throw new Error(`HTTP ${r.status}`);
				const blob = await r.blob();
				const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none' as any, colorSpaceConversion: 'none' as any } as any);
				return bmp as any;
			} catch {}
		}
		try {
			const img = new Image();
			(img as any).crossOrigin = 'anonymous';
			(img as any).decoding = 'async';
			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () => reject(new Error('icon load failed'));
				img.src = url;
			});
			return img as any;
		} catch {
			return null;
		}
	}

	draw(ctx: {
		gl: WebGLRenderingContext;
		prog: WebGLProgram;
		loc: any;
		quad: WebGLBuffer;
		canvas: HTMLCanvasElement;
		dpr: number;
		tileSize: number;
		zoom: number;
		center: { lng: number; lat: number };
		container: HTMLElement;
		project: (x: number, y: number, z: number) => { x: number; y: number };
		wrapX: boolean;
	}) {
		if (this.markers.length === 0) return;
		const gl = ctx.gl;
		const { zInt: baseZ, scale: effScale } = Coords.zParts(ctx.zoom);
		const rect = ctx.container.getBoundingClientRect();
		const widthCSS = rect.width;
		const heightCSS = rect.height;
		const centerLevel = ctx.project(ctx.center.lng, ctx.center.lat, baseZ);
		let tlWorld = Coords.tlLevelFor(centerLevel, ctx.zoom, { x: widthCSS, y: heightCSS });
		const snap = (v: number) => Coords.snapLevelToDevice(v, effScale, ctx.dpr);
		tlWorld = { x: snap(tlWorld.x), y: snap(tlWorld.y) };

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

			// For each type
			const isGL2 = (gl as any).drawArraysInstanced !== undefined;
			const seen = new Set<string>();
			for (const m of this.markers) {
				seen.add(m.type);
			}
			for (const type of Array.from(seen)) {
				const tex = this.textures.get(type);
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
					rec = { buf, count: td.data.length / 4, version: td.version, uploaded: td.version, capacityBytes };
					this.instBuffers.set(type, rec);
				} else if (rec.uploaded !== td.version) {
					gl.bindBuffer(gl.ARRAY_BUFFER, rec.buf);
					const LARGE_BYTES = 1 << 20; // 1MB
					const prevCount = Math.max(1, rec.count);
					const newCount = td.data.length / 4;
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
				gl.vertexAttribPointer(this.instLoc!.a_i_native, 2, gl.FLOAT, false, 16, 0);
				if (isGL2) (gl as any).vertexAttribDivisor(this.instLoc!.a_i_native, 1);
				else this.instExt!.vertexAttribDivisorANGLE(this.instLoc!.a_i_native, 1);
				gl.enableVertexAttribArray(this.instLoc!.a_i_size);
				gl.vertexAttribPointer(this.instLoc!.a_i_size, 2, gl.FLOAT, false, 16, 8);
				if (isGL2) (gl as any).vertexAttribDivisor(this.instLoc!.a_i_size, 1);
				else this.instExt!.vertexAttribDivisorANGLE(this.instLoc!.a_i_size, 1);
				gl.bindTexture(gl.TEXTURE_2D, tex);
				// Set UVs based on atlas packing (or full if missing)
				const uv = this.uvRect.get(type) || { u0: 0, v0: 0, u1: 1, v1: 1 };
				gl.uniform2f(this.instLoc!.u_uv0!, uv.u0, uv.v0);
				gl.uniform2f(this.instLoc!.u_uv1!, uv.u1, uv.v1);
				if (isGL2) (gl as any).drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, rec.count);
				else this.instExt!.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, 4, rec.count);
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

		// Group markers by type to minimize texture binds
		const groups = new Map<string, Marker[]>();
		for (const m of this.markers) {
			if (!groups.has(m.type)) groups.set(m.type, []);
			groups.get(m.type)!.push(m);
		}

		for (const [type, list] of groups) {
			const tex = this.textures.get(type);
			const sz = this.texSize.get(type);
			if (!tex || !sz) continue;
			gl.bindTexture(gl.TEXTURE_2D, tex);
			const uv = this.uvRect.get(type) || { u0: 0, v0: 0, u1: 1, v1: 1 };
			gl.uniform2f(ctx.loc.u_uv0!, uv.u0, uv.v0);
			gl.uniform2f(ctx.loc.u_uv1!, uv.u1, uv.v1);
			for (const m of list) {
				const p = ctx.project(m.lng, m.lat, zInt);
				let xCSS = (p.x - tlWorld.x) * scale;
				let yCSS = (p.y - tlWorld.y) * scale;
				const w = m.size || sz.w;
				const h = m.size || sz.h;
				// Center the icon on (xCSS, yCSS)
				xCSS = xCSS - w / 2;
				yCSS = yCSS - h / 2;
				// Frustum cull
				if (xCSS + w < 0 || yCSS + h < 0 || xCSS > widthCSS || yCSS > heightCSS) continue;
				// Avoid rounding before multiplying by dpr to prevent subpixel jitter
				const tx = Math.round(xCSS * ctx.dpr);
				const ty = Math.round(yCSS * ctx.dpr);
				const tw = Math.max(1, Math.round(w * ctx.dpr));
				const th = Math.max(1, Math.round(h * ctx.dpr));
				gl.uniform2f(ctx.loc.u_translate, tx, ty);
				gl.uniform2f(ctx.loc.u_size, tw, th);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			}
		}
	}

	private ensureInstanced(gl: WebGLRenderingContext): boolean {
		if (!this.instExt) {
			try {
				this.instExt = (gl as any).getExtension('ANGLE_instanced_arrays') || null;
			} catch {
				this.instExt = null;
			}
		}
		if (!this.instExt) return false;
		if (!this.instProg) {
			const vs = `
        attribute vec2 a_pos;
        attribute vec2 a_i_native;
        attribute vec2 a_i_size;
        uniform vec2 u_resolution;
        uniform vec2 u_tlWorld;
        uniform float u_scale;
        uniform float u_dpr;
        uniform float u_invS;
        varying vec2 v_uv;
        void main(){
          vec2 world = a_i_native * u_invS;
          vec2 css = (world - u_tlWorld) * u_scale;
          vec2 sizePx = a_i_size;
          vec2 pixelPos = (css - 0.5 * sizePx) * u_dpr + a_pos * (sizePx * u_dpr);
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
				u_resolution: gl.getUniformLocation(prog, 'u_resolution'),
				u_tlWorld: gl.getUniformLocation(prog, 'u_tlWorld'),
				u_scale: gl.getUniformLocation(prog, 'u_scale'),
				u_dpr: gl.getUniformLocation(prog, 'u_dpr'),
				u_invS: gl.getUniformLocation(prog, 'u_invS'),
				u_tex: gl.getUniformLocation(prog, 'u_tex'),
				u_alpha: gl.getUniformLocation(prog, 'u_alpha'),
				u_uv0: gl.getUniformLocation(prog, 'u_uv0'),
				u_uv1: gl.getUniformLocation(prog, 'u_uv1'),
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

function roundCapacity(n: number): number {
	// grow with 1.5x headroom up to next power-of-two-like boundary
	const target = Math.floor(n * 1.5);
	let p = 1;
	while (p < target) p <<= 1;
	return p;
}
