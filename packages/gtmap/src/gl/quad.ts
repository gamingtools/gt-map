// Unit quad VBO helper (0..1 in both axes, 2D positions)

export function createUnitQuad(gl: WebGLRenderingContext): WebGLBuffer {
	const buf = gl.createBuffer();
	if (!buf) throw new Error('Failed to create quad buffer');
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	// Two triangles: (0,0)-(1,0)-(0,1) and (1,0)-(1,1)
	const data = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	return buf;
}
