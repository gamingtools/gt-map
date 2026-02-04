/**
 * IconInstanceBuffers -- per-type GPU buffer management for instanced marker rendering.
 */
import type { MarkerRenderData, IconSizeProvider } from './types';

export class IconInstanceBuffers {
	private typeData = new Map<string, { data: Float32Array; version: number }>();
	private typeMinZ = new Map<string, number>();
	private typeMarkers = new Map<string, MarkerRenderData[]>();
	private instBuffers = new Map<string, { buf: WebGLBuffer; count: number; version: number; uploaded: number; capacityBytes: number }>();
	hasCustomIconScale = false;
	iconScaleDirty = false;
	lastBuildZoom = 0;
	lastBuildMinZoom = 0;
	lastBuildMaxZoom = 19;

	/**
	 * Rebuild per-type instance data arrays for GPU upload.
	 *
	 * Groups all markers by icon type and packs their data into Float32Arrays:
	 * [x, y, width, height, anchorX, anchorY, angle, iconScale] x N instances
	 *
	 * A version counter tracks when data changes, allowing the GPU buffer
	 * upload to skip unchanged types.
	 */
	rebuildTypeData(markers: MarkerRenderData[], decals: MarkerRenderData[], sizes: IconSizeProvider): void {
		const all = [...markers, ...decals];
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
		this.iconScaleDirty = hasCustom;
		this.typeMarkers = byType;

		this.typeMinZ.clear();
		const zoom = this.lastBuildZoom;
		const minZoom = this.lastBuildMinZoom;
		const maxZoom = this.lastBuildMaxZoom;

		for (const [type, list] of byType) {
			const sz = sizes.getSize(type);
			const anc = sizes.getAnchor(type);
			const data = new Float32Array(list.length * 8);
			let j = 0;
			let minZ = Infinity;
			for (const m of list) {
				const w = m.size ?? sz.w;
				const h = m.size ?? sz.h;
				const scaleX = m.size != null ? m.size / sz.w : 1;
				const scaleY = m.size != null ? m.size / sz.h : 1;
				const ax = anc.ax * scaleX;
				const ay = anc.ay * scaleY;
				let iconScale = 1.0;
				if (m.iconScaleFunction === null) {
					iconScale = 1.0;
				} else if (m.iconScaleFunction !== undefined) {
					iconScale = m.iconScaleFunction(zoom, minZoom, maxZoom);
				}
				data[j++] = m.x;
				data[j++] = m.y;
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

	/**
	 * Update iconScale values in typeData when zoom changes.
	 * Only needed if any markers have custom iconScaleFunction.
	 */
	updateIconScales(zoom: number, minZoom: number, maxZoom: number, mapIconScale: number): void {
		if (!this.hasCustomIconScale) return;
		for (const [type, list] of this.typeMarkers) {
			const td = this.typeData.get(type);
			if (!td) continue;
			const data = td.data;
			for (let i = 0; i < list.length; i++) {
				const m = list[i]!;
				let iconScale: number;
				if (m.iconScaleFunction === null) {
					iconScale = 1.0;
				} else if (m.iconScaleFunction !== undefined) {
					iconScale = m.iconScaleFunction(zoom, minZoom, maxZoom);
				} else {
					iconScale = mapIconScale;
				}
				data[i * 8 + 7] = iconScale;
			}
			td.version++;
		}
		this.lastBuildZoom = zoom;
		this.lastBuildMinZoom = minZoom;
		this.lastBuildMaxZoom = maxZoom;
		this.iconScaleDirty = false;
	}

	// -- Accessors --

	getTypeData(type: string): { data: Float32Array; version: number } | undefined {
		return this.typeData.get(type);
	}

	getTypeMinZ(type: string): number {
		return this.typeMinZ.get(type) ?? 0;
	}

	/** Return all types present in markers/decals, sorted by their minimum z-index. */
	getSortedTypes(markers: MarkerRenderData[], decals: MarkerRenderData[]): string[] {
		const seen = new Set<string>();
		for (const m of markers) seen.add(m.type);
		for (const d of decals) seen.add(d.type);
		return Array.from(seen).sort((a, b) => this.getTypeMinZ(a) - this.getTypeMinZ(b));
	}

	// -- GPU buffer sync --

	/**
	 * Create, update, or bind the GPU buffer for a type.
	 * Returns the instance count, or null if no data is available.
	 * After this call the buffer is bound to ARRAY_BUFFER.
	 */
	syncBuffer(gl: WebGLRenderingContext, type: string): number | null {
		const td = this.typeData.get(type);
		if (!td) return null;

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
			const newCount = td.data.length / 8;
			const deltaRatio = Math.abs(newCount - prevCount) / prevCount;
			const needResize = byteLen > rec.capacityBytes;
			const shouldOrphan = needResize || byteLen >= LARGE_BYTES || deltaRatio >= 0.25;
			if (shouldOrphan) {
				const newCap = needResize ? roundCapacity(byteLen) : rec.capacityBytes;
				gl.bufferData(gl.ARRAY_BUFFER, newCap, gl.DYNAMIC_DRAW);
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
		return rec.count;
	}

	// -- Cleanup --

	dispose(gl: WebGLRenderingContext): void {
		try {
			for (const rec of this.instBuffers.values()) {
				try {
					gl.deleteBuffer(rec.buf);
				} catch {
					/* expected: GL context may be lost */
				}
			}
		} catch {
			/* expected: GL context may be lost */
		}
		this.instBuffers.clear();
		this.typeData.clear();
		this.typeMinZ.clear();
		this.typeMarkers.clear();
	}
}

/**
 * Round buffer capacity up to a power-of-two with 1.5x headroom.
 * Reduces buffer reallocations by adding 50% headroom and rounding to power-of-two.
 */
function roundCapacity(n: number): number {
	const target = Math.floor(n * 1.5);
	let p = 1;
	while (p < target) p <<= 1;
	return p;
}
