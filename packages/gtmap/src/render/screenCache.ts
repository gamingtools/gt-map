// Screen cache module: keep a copy of the last frame in a texture
// and draw it during small zoom/pan deltas to reduce flicker.

export type ScreenCacheState = {
  zInt: number;
  scale: number;
  tlWorld: { x: number; y: number };
  widthCSS: number;
  heightCSS: number;
  dpr: number;
};

export type ProgramLocs = {
  a_pos: number;
  u_translate: WebGLUniformLocation | null;
  u_size: WebGLUniformLocation | null;
  u_resolution: WebGLUniformLocation | null;
  u_tex: WebGLUniformLocation | null;
  u_alpha: WebGLUniformLocation | null;
  u_uv0: WebGLUniformLocation | null;
  u_uv1: WebGLUniformLocation | null;
};

export class ScreenCache {
  private gl: WebGLRenderingContext;
  private tex: WebGLTexture | null = null;
  private state: ScreenCacheState | null = null;
  private internalFormat: number;

  constructor(gl: WebGLRenderingContext, internalFormat?: number) {
    this.gl = gl;
    // Detect RGB vs RGBA based on context alpha if not provided.
    if (internalFormat != null) {
      this.internalFormat = internalFormat;
    } else {
      let fmt = gl.RGBA;
      try {
        const attrs = (gl as any).getContextAttributes?.();
        fmt = attrs && attrs.alpha === false ? gl.RGB : gl.RGBA;
      } catch {}
      this.internalFormat = fmt;
    }
  }

  dispose() {
    if (this.tex) {
      try { this.gl.deleteTexture(this.tex); } catch {}
      this.tex = null;
    }
    this.state = null;
  }

  private ensureTex(width: number, height: number) {
    const gl = this.gl;
    if (!this.tex) {
      this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fmt = this.internalFormat;
      gl.texImage2D(gl.TEXTURE_2D, 0, fmt, width, height, 0, fmt, gl.UNSIGNED_BYTE, null);
    } else {
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
    }
  }

  update(curr: ScreenCacheState, canvas: HTMLCanvasElement) {
    try {
      const gl = this.gl;
      this.ensureTex(canvas.width, canvas.height);
      gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, canvas.width, canvas.height);
      this.state = {
        zInt: curr.zInt,
        scale: curr.scale,
        tlWorld: { x: curr.tlWorld.x, y: curr.tlWorld.y },
        widthCSS: curr.widthCSS,
        heightCSS: curr.heightCSS,
        dpr: curr.dpr,
      };
    } catch {
      // ignore GL errors in copy path
    }
  }

  draw(
    curr: ScreenCacheState,
    loc: ProgramLocs,
    prog: WebGLProgram,
    quad: WebGLBuffer,
    canvas: HTMLCanvasElement,
  ) {
    const prev = this.state;
    if (!prev || !this.tex) return;
    // Require same CSS size/DPR and same integer zoom level
    if (prev.widthCSS !== curr.widthCSS || prev.heightCSS !== curr.heightCSS || prev.dpr !== curr.dpr) return;
    if (prev.zInt !== curr.zInt) return;

    const gl = this.gl;
    const s = curr.scale / Math.max(1e-6, prev.scale);
    if (!(s > 0.92 && s < 1.08)) return;
    const dxCSS = (prev.tlWorld.x - curr.tlWorld.x) * curr.scale;
    const dyCSS = (prev.tlWorld.y - curr.tlWorld.y) * curr.scale;
    const dxPx = dxCSS * curr.dpr;
    const dyPx = dyCSS * curr.dpr;
    const wPx = canvas.width * s;
    const hPx = canvas.height * s;
    if (Math.abs(dxPx) > canvas.width * 0.5 || Math.abs(dyPx) > canvas.height * 0.5) return;

    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(loc.a_pos);
    gl.vertexAttribPointer(loc.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(loc.u_resolution!, canvas.width, canvas.height);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(loc.u_tex!, 0);
    gl.uniform1f(loc.u_alpha!, 0.85);
    gl.uniform2f(loc.u_uv0!, 0.0, 1.0);
    gl.uniform2f(loc.u_uv1!, 1.0, 0.0);
    gl.uniform2f(loc.u_translate!, dxPx, dyPx);
    gl.uniform2f(loc.u_size!, wPx, hPx);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // restore alpha and UVs for subsequent draws
    gl.uniform1f(loc.u_alpha!, 1.0);
    gl.uniform2f(loc.u_uv0!, 0.0, 0.0);
    gl.uniform2f(loc.u_uv1!, 1.0, 1.0);
  }
}

