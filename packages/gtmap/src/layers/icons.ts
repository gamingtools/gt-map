export type IconDef = { id: string; url: string; width: number; height: number };
export type Marker = { lng: number; lat: number; type: string; size?: number };

export class IconRenderer {
  private gl: WebGLRenderingContext;
  private textures = new Map<string, WebGLTexture>();
  private texSize = new Map<string, { w: number; h: number }>();
  private markers: Marker[] = [];

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  async loadIcons(defs: Record<string, { iconPath: string; x2IconPath?: string; width: number; height: number }>) {
    const useX2 = (typeof devicePixelRatio !== 'undefined') && devicePixelRatio >= 1.75;
    const entries = Object.entries(defs);
    await Promise.all(
      entries.map(async ([key, d]) => {
        const url = (useX2 && d.x2IconPath) ? d.x2IconPath : d.iconPath;
        const tex = await this.createTextureFromUrl(url);
        if (tex) {
          this.textures.set(key, tex);
          this.texSize.set(key, { w: d.width, h: d.height });
        }
      }),
    );
  }

  setMarkers(markers: Marker[]) {
    this.markers = markers || [];
  }

  private async createTextureFromUrl(url: string): Promise<WebGLTexture | null> {
    const gl = this.gl;
    // Prefer fetch+createImageBitmap for proper CORS handling (same pattern as tiles)
    if (typeof fetch === 'function' && typeof createImageBitmap === 'function') {
      try {
        const r = await fetch(url, { mode: 'cors', credentials: 'omit' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const blob = await r.blob();
        const bmp = await createImageBitmap(blob, {
          premultiplyAlpha: 'none' as any,
          colorSpaceConversion: 'none' as any,
        } as any);
        try {
          const tex = gl.createTexture();
          if (!tex) return null;
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
          gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp as any);
          return tex;
        } finally {
          try { (bmp as any).close?.(); } catch {}
        }
      } catch (e) {
        console.warn('Icon fetch/bitmap failed; falling back to Image()', e);
      }
    }
    // Fallback: HTMLImageElement (requires CORS headers on server)
    try {
      const img = new Image();
      (img as any).crossOrigin = 'anonymous';
      (img as any).decoding = 'async';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('icon load failed'));
        img.src = url;
      });
      const tex = gl.createTexture();
      if (!tex) return null;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img as any);
      return tex;
    } catch (err) {
      console.warn('Icon Image() load failed', err);
      return null;
    }
  }

  draw(ctx: {
    gl: WebGLRenderingContext;
    prog: WebGLProgram;
    loc: any;
    quad: WebGLBuffer;
    canvas: HTMLCanvasElement;
    dpr: number;
    tileSize: number;
    zoom: number;
    center: { lng: number; lat: number };
    container: HTMLElement;
    project: (x: number, y: number, z: number) => { x: number; y: number };
    wrapX: boolean;
  }) {
    if (this.markers.length === 0) return;
    const gl = ctx.gl;
    const zInt = Math.floor(ctx.zoom);
    const scale = Math.pow(2, ctx.zoom - zInt);
    const rect = ctx.container.getBoundingClientRect();
    const widthCSS = rect.width;
    const heightCSS = rect.height;
    const centerWorld = ctx.project(ctx.center.lng, ctx.center.lat, zInt);
    const tlWorld = { x: centerWorld.x - widthCSS / (2 * scale), y: centerWorld.y - heightCSS / (2 * scale) };

    gl.useProgram(ctx.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
    gl.enableVertexAttribArray(ctx.loc.a_pos);
    gl.vertexAttribPointer(ctx.loc.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(ctx.loc.u_resolution, ctx.canvas.width, ctx.canvas.height);
    gl.uniform1i(ctx.loc.u_tex, 0);
    gl.uniform1f(ctx.loc.u_alpha, 1.0);
    gl.uniform2f(ctx.loc.u_uv0!, 0.0, 0.0);
    gl.uniform2f(ctx.loc.u_uv1!, 1.0, 1.0);

    // Group markers by type to minimize texture binds
    const groups = new Map<string, Marker[]>();
    for (const m of this.markers) {
      if (!groups.has(m.type)) groups.set(m.type, []);
      groups.get(m.type)!.push(m);
    }

    for (const [type, list] of groups) {
      const tex = this.textures.get(type);
      const sz = this.texSize.get(type);
      if (!tex || !sz) continue;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      for (const m of list) {
        const p = ctx.project(m.lng, m.lat, zInt);
        let xCSS = (p.x - tlWorld.x) * scale;
        let yCSS = (p.y - tlWorld.y) * scale;
        const w = (m.size || sz.w);
        const h = (m.size || sz.h);
        // Center the icon on (xCSS, yCSS)
        xCSS = xCSS - w / 2;
        yCSS = yCSS - h / 2;
        // Frustum cull
        if (xCSS + w < 0 || yCSS + h < 0 || xCSS > widthCSS || yCSS > heightCSS) continue;
        // Avoid rounding before multiplying by dpr to prevent subpixel jitter
        gl.uniform2f(ctx.loc.u_translate, xCSS * ctx.dpr, yCSS * ctx.dpr);
        gl.uniform2f(ctx.loc.u_size, w * ctx.dpr, h * ctx.dpr);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
  }
}
