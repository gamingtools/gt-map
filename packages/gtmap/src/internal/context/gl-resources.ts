/**
 * GLResources -- bundles the WebGL program, quad buffer, and shader locations.
 *
 * Replaces the _prog, _quad, _loc, _screenTexFormat fields previously held
 * directly on the GraphicsHost / mapgl god class.
 */
import type { ShaderLocations } from '../../api/types';

export class GLResources {
	prog: WebGLProgram;
	quad: WebGLBuffer;
	loc: ShaderLocations;
	screenTexFormat: number;

	constructor(prog: WebGLProgram, quad: WebGLBuffer, loc: ShaderLocations, screenTexFormat: number) {
		this.prog = prog;
		this.quad = quad;
		this.loc = loc;
		this.screenTexFormat = screenTexFormat;
	}

	dispose(gl: WebGLRenderingContext): void {
		try {
			gl.deleteBuffer(this.quad);
		} catch {}
		try {
			gl.deleteProgram(this.prog);
		} catch {}
	}
}
