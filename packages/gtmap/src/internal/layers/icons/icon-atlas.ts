export type AtlasInput = Array<{ key: string; w: number; h: number; src: ImageBitmap | HTMLImageElement | HTMLCanvasElement }>;
export type AtlasEntry = { tex: WebGLTexture; uv: { u0: number; v0: number; u1: number; v1: number } };

export function createAtlas(gl: WebGLRenderingContext, imgs: AtlasInput): Map<string, AtlasEntry> | null {
	const MAX_W = 2048;
	let x = 0,
		y = 0,
		rowH = 0,
		atlasW = 0,
		atlasH = 0;
	const list = [...imgs];
	list.sort((a, b) => b.h - a.h);
	const pos: Record<string, { x: number; y: number; w: number; h: number }> = {};
	for (const img of list) {
		if (img.w > MAX_W) continue;
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
	const canvas = document.createElement('canvas');
	canvas.width = atlasW || 1;
	canvas.height = atlasH || 1;
	const ctx2d = canvas.getContext('2d');
	if (!ctx2d) return null;
	ctx2d.clearRect(0, 0, canvas.width, canvas.height);
	for (const img of list) {
		const p = pos[img.key];
		if (!p) continue;
		try {
			const src = img.src as CanvasImageSource;
			const sw = (img.src as HTMLImageElement).naturalWidth || (img.src as ImageBitmap | HTMLCanvasElement).width;
			const sh = (img.src as HTMLImageElement).naturalHeight || (img.src as ImageBitmap | HTMLCanvasElement).height;
			ctx2d.drawImage(src, 0, 0, sw, sh, p.x, p.y, p.w, p.h);
		} catch {}
	}
	const tex = gl.createTexture();
	if (!tex) return null;
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
	const result = new Map<string, AtlasEntry>();
	for (const img of list) {
		const p = pos[img.key];
		if (!p) continue;
		const u0 = p.x / atlasW,
			v0 = p.y / atlasH,
			u1 = (p.x + p.w) / atlasW,
			v1 = (p.y + p.h) / atlasH;
		result.set(img.key, { tex, uv: { u0, v0, u1, v1 } });
	}
	return result;
}
