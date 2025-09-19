import type { ProgramLocs } from '../render/screen-cache';
import type { UpscaleFilterMode } from '../../api/types';

export class RasterRenderer {
	private gl: WebGLRenderingContext;

	constructor(gl: WebGLRenderingContext) {
		this.gl = gl;
	}

	drawImage(
		loc: ProgramLocs,
		params: {
			texture: WebGLTexture;
			translateCss: { x: number; y: number };
			sizeCss: { width: number; height: number };
			dpr: number;
			imageWidth: number;
			imageHeight: number;
			filterMode?: UpscaleFilterMode;
		},
	) {
		const { gl } = this;
		const { texture, translateCss, sizeCss, dpr, imageWidth, imageHeight, filterMode } = params;

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		const translatePx = { x: translateCss.x * dpr, y: translateCss.y * dpr };
		const sizePx = { width: sizeCss.width * dpr, height: sizeCss.height * dpr };

		gl.uniform2f(loc.u_translate!, translatePx.x, translatePx.y);
		gl.uniform2f(loc.u_size!, Math.max(1, sizePx.width), Math.max(1, sizePx.height));
		gl.uniform2f(loc.u_uv0!, 0, 0);
		gl.uniform2f(loc.u_uv1!, 1, 1);
		gl.uniform1i(loc.u_tex!, 0);

		if (loc.u_texel) gl.uniform2f(loc.u_texel, 1 / Math.max(1, imageWidth), 1 / Math.max(1, imageHeight));

		let mode = 0;
		if (filterMode === 'bicubic') mode = 1;
		else if (filterMode === 'auto') {
			const upscaleX = sizeCss.width / Math.max(1, imageWidth);
			const upscaleY = sizeCss.height / Math.max(1, imageHeight);
			if (upscaleX > 1.01 || upscaleY > 1.01) mode = 1;
		}
		if (loc.u_filterMode) gl.uniform1i(loc.u_filterMode, mode);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}
}
