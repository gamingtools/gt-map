/**
 * GLManager -- WebGL context initialization, program compilation, and context lifecycle.
 *
 * Owns GLHostAdapter + Graphics; provides init/reinit/release/restore for GL state.
 */
import type { WebGLLoseContext, ShaderLocations } from '../../api/types';
import { GLResources } from '../context/gl-resources';
import Graphics, { type GraphicsHost } from '../gl/graphics';

/**
 * Lightweight GraphicsHost adapter so Graphics can write prog/quad/loc
 * into a GLResources bundle rather than the old god-class fields.
 */
class GLHostAdapter implements GraphicsHost {
	canvas: HTMLCanvasElement;
	gl!: WebGLRenderingContext;
	_screenTexFormat = 0;
	_prog: WebGLProgram | null = null;
	_loc: ShaderLocations | null = null;
	_quad: WebGLBuffer | null = null;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
	}

	toResources(): GLResources {
		return new GLResources(this._prog!, this._quad!, this._loc!, this._screenTexFormat);
	}
}

export class GLManager {
	private _host: GLHostAdapter;
	private _gfx: Graphics;
	private _glReleased = false;

	constructor(canvas: HTMLCanvasElement) {
		this._host = new GLHostAdapter(canvas);
		this._gfx = new Graphics(this._host);
	}

	/** Initialize the WebGL context. Returns the GL context. */
	initContext(bgColor: [number, number, number, number]): WebGLRenderingContext {
		this._gfx.init(true, bgColor);
		return this._host.gl;
	}

	/** Compile shaders and create programs. Returns a GLResources bundle. */
	initPrograms(): GLResources {
		this._gfx.initPrograms();
		return this._host.toResources();
	}

	/** Release the GL context via WEBGL_lose_context. */
	releaseContext(gl: WebGLRenderingContext): void {
		try {
			const ext = gl.getExtension?.('WEBGL_lose_context') as WebGLLoseContext | null;
			ext?.loseContext();
			this._glReleased = true;
		} catch {
			/* expected: extension may not be available */
		}
	}

	/**
	 * Reinitialize GL after context release.
	 * Restores context, re-creates GL state, and recompiles programs.
	 */
	reinit(gl: WebGLRenderingContext | null, bgColor: [number, number, number, number], debugWarn: (msg: string, err?: unknown) => void): { gl: WebGLRenderingContext; glResources: GLResources } {
		try {
			const ext = gl?.getExtension?.('WEBGL_lose_context') as WebGLLoseContext | null;
			ext?.restoreContext();
		} catch (e) {
			debugWarn('GL restore context', e);
		}

		let newGL: WebGLRenderingContext;
		try {
			this._gfx.init(true, bgColor);
			newGL = this._host.gl;
		} catch (e) {
			debugWarn('GL reinit graphics', e);
			newGL = this._host.gl;
		}

		let glResources: GLResources;
		try {
			this._gfx.initPrograms();
			glResources = this._host.toResources();
		} catch (e) {
			debugWarn('GL reinit programs', e);
			glResources = this._host.toResources();
		}

		this._glReleased = false;
		return { gl: newGL, glResources };
	}

	get glReleased(): boolean {
		return this._glReleased;
	}
}
