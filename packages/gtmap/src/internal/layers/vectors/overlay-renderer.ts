/**
 * OverlayRenderer - Renders a Canvas 2D content as a WebGL texture overlay.
 * Used for hybrid Canvas2D/WebGL vector rendering with z-ordering support.
 */

const OVERLAY_VS = `
attribute vec2 a_pos;
varying vec2 v_uv;

void main() {
	v_uv = a_pos;
	vec2 clip = a_pos * 2.0 - 1.0;
	clip.y *= -1.0;
	gl_Position = vec4(clip, 0.0, 1.0);
}
`;

const OVERLAY_FS = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_texture;

void main() {
	gl_FragColor = texture2D(u_texture, v_uv);
}
`;

export class OverlayRenderer {
	private gl: WebGLRenderingContext;
	private program: WebGLProgram | null = null;
	private quadBuffer: WebGLBuffer | null = null;
	private texture: WebGLTexture | null = null;
	private texWidth = 0;
	private texHeight = 0;
	private aPos = -1;
	private uTexture: WebGLUniformLocation | null = null;

	constructor(gl: WebGLRenderingContext) {
		this.gl = gl;
		this.initProgram();
		this.initQuad();
	}

	private initProgram(): void {
		const gl = this.gl;

		const vs = gl.createShader(gl.VERTEX_SHADER);
		if (!vs) return;
		gl.shaderSource(vs, OVERLAY_VS);
		gl.compileShader(vs);
		if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
			console.error('Overlay VS error:', gl.getShaderInfoLog(vs));
			gl.deleteShader(vs);
			return;
		}

		const fs = gl.createShader(gl.FRAGMENT_SHADER);
		if (!fs) {
			gl.deleteShader(vs);
			return;
		}
		gl.shaderSource(fs, OVERLAY_FS);
		gl.compileShader(fs);
		if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
			console.error('Overlay FS error:', gl.getShaderInfoLog(fs));
			gl.deleteShader(vs);
			gl.deleteShader(fs);
			return;
		}

		const prog = gl.createProgram();
		if (!prog) {
			gl.deleteShader(vs);
			gl.deleteShader(fs);
			return;
		}

		gl.attachShader(prog, vs);
		gl.attachShader(prog, fs);
		gl.linkProgram(prog);

		if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
			console.error('Overlay program link error:', gl.getProgramInfoLog(prog));
			gl.deleteProgram(prog);
			gl.deleteShader(vs);
			gl.deleteShader(fs);
			return;
		}

		gl.deleteShader(vs);
		gl.deleteShader(fs);

		this.program = prog;
		this.aPos = gl.getAttribLocation(prog, 'a_pos');
		this.uTexture = gl.getUniformLocation(prog, 'u_texture');
	}

	private initQuad(): void {
		const gl = this.gl;
		this.quadBuffer = gl.createBuffer();
		if (this.quadBuffer) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
			// Unit quad covering full viewport
			const quad = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
			gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
		}
	}

	/**
	 * Upload canvas content to texture.
	 */
	uploadCanvas(canvas: HTMLCanvasElement | OffscreenCanvas): void {
		const gl = this.gl;
		const width = canvas.width;
		const height = canvas.height;

		if (!this.texture) {
			this.texture = gl.createTexture();
		}

		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		// Resize texture if needed
		if (width !== this.texWidth || height !== this.texHeight) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas as TexImageSource);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			this.texWidth = width;
			this.texHeight = height;
		} else {
			// Just update the content
			gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas as TexImageSource);
		}

		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	/**
	 * Draw the overlay texture as a full-screen quad.
	 */
	draw(): void {
		if (!this.program || !this.quadBuffer || !this.texture) return;

		const gl = this.gl;

		gl.useProgram(this.program);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.uniform1i(this.uTexture, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
		gl.enableVertexAttribArray(this.aPos);
		gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		gl.disableVertexAttribArray(this.aPos);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	/**
	 * Check if renderer is ready.
	 */
	isReady(): boolean {
		return this.program !== null && this.texture !== null;
	}

	/**
	 * Clean up GPU resources.
	 */
	dispose(): void {
		const gl = this.gl;
		if (this.program) gl.deleteProgram(this.program);
		if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer);
		if (this.texture) gl.deleteTexture(this.texture);
		this.program = null;
		this.quadBuffer = null;
		this.texture = null;
	}
}
