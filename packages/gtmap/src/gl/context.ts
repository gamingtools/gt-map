export function initGL(map: any): WebGLRenderingContext {
  const gl = map.canvas.getContext('webgl', { alpha: false, antialias: false }) as WebGLRenderingContext | null;
  if (!gl) throw new Error('WebGL not supported');
  map.gl = gl;
  gl.clearColor(0.93, 0.93, 0.93, 1);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  map._screenTexFormat = detectScreenFormat(gl);
  return gl;
}

export function detectScreenFormat(gl: WebGLRenderingContext): number {
  try {
    const attrs = (gl as any).getContextAttributes?.();
    return attrs && attrs.alpha === false ? (gl.RGB as number) : (gl.RGBA as number);
  } catch {
    return gl.RGBA as number;
  }
}

