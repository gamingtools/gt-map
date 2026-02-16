/**
 * LayerFBO -- reusable offscreen framebuffer for opacity compositing.
 *
 * When a layer's opacity < 1, tiles/markers are rendered into this offscreen
 * FBO first, then composited onto the main framebuffer at the target alpha.
 * This prevents double-alpha artifacts from backfill + base tile overlap.
 *
 * Extracted from MapRenderer.ensureFbo().
 */
import type { ProgramLocs } from './screen-cache';

export class LayerFBO {
	private _gl: WebGLRenderingContext | null = null;
	private _fbo: WebGLFramebuffer | null = null;
	private _fboTex: WebGLTexture | null = null;
	private _fboW = 0;
	private _fboH = 0;

	/**
	 * Lazily create / resize the offscreen FBO.
	 * Returns true if the FBO is ready for use, false if it failed.
	 */
	ensure(gl: WebGLRenderingContext, w: number, h: number): boolean {
		// Reset FBO state if the GL context changed (e.g. after context loss/restore)
		if (this._gl && this._gl !== gl) {
			this._fbo = null;
			this._fboTex = null;
			this._fboW = 0;
			this._fboH = 0;
		}
		this._gl = gl;

		// Clamp to MAX_TEXTURE_SIZE to avoid incomplete FBO on large canvases
		const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
		if (w > maxSize || h > maxSize) return false;

		if (!this._fbo) {
			const fbo = gl.createFramebuffer();
			const tex = gl.createTexture();
			if (!fbo || !tex) {
				if (fbo)
					try {
						gl.deleteFramebuffer(fbo);
					} catch {
						/* noop */
					}
				if (tex)
					try {
						gl.deleteTexture(tex);
					} catch {
						/* noop */
					}
				return false;
			}
			this._fbo = fbo;
			this._fboTex = tex;
			gl.bindTexture(gl.TEXTURE_2D, this._fboTex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			this._fboW = 0;
		}
		if (this._fboW !== w || this._fboH !== h) {
			gl.bindTexture(gl.TEXTURE_2D, this._fboTex!);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._fboTex, 0);
			const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			if (status !== gl.FRAMEBUFFER_COMPLETE) {
				return false;
			}
			this._fboW = w;
			this._fboH = h;
		}
		return true;
	}

	/**
	 * Bind the FBO for offscreen rendering.
	 * Clears the color buffer to transparent black.
	 */
	bind(gl: WebGLRenderingContext): void {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo!);
		const pc = gl.getParameter(gl.COLOR_CLEAR_VALUE) as Float32Array;
		const pcR = pc[0] ?? 0,
			pcG = pc[1] ?? 0,
			pcB = pc[2] ?? 0,
			pcA = pc[3] ?? 0;
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.clearColor(pcR, pcG, pcB, pcA);
	}

	/**
	 * Unbind the FBO and composite its contents onto the default framebuffer
	 * at the given alpha.
	 */
	unbindAndComposite(gl: WebGLRenderingContext, loc: ProgramLocs, alpha: number, canvasW: number, canvasH: number): void {
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this._fboTex!);
		gl.uniform1f(loc.u_alpha!, alpha);
		gl.uniform2f(loc.u_translate!, 0, 0);
		gl.uniform2f(loc.u_size!, canvasW, canvasH);
		gl.uniform2f(loc.u_uv0!, 0.0, 1.0);
		gl.uniform2f(loc.u_uv1!, 1.0, 0.0);
		if (loc.u_filterMode) gl.uniform1i(loc.u_filterMode, 0);
		if (loc.u_texel) gl.uniform2f(loc.u_texel, 1.0, 1.0);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		// Restore UVs for subsequent draws
		gl.uniform2f(loc.u_uv0!, 0.0, 0.0);
		gl.uniform2f(loc.u_uv1!, 1.0, 1.0);
	}

	dispose(): void {
		const gl = this._gl;
		if (gl) {
			if (this._fboTex)
				try {
					gl.deleteTexture(this._fboTex);
				} catch {
					/* GL context may be lost */
				}
			if (this._fbo)
				try {
					gl.deleteFramebuffer(this._fbo);
				} catch {
					/* GL context may be lost */
				}
		}
		this._fbo = null;
		this._fboTex = null;
		this._fboW = 0;
		this._fboH = 0;
	}
}
