// Tile image loader with dependency injection for side-effects
export type TileTask = { key: string; url: string };
export type TileLoaderDeps = {
  addPending(key: string): void;
  removePending(key: string): void;
  incInflight(): void;
  decInflight(): void;
  setLoading(key: string): void;
  setError(key: string): void;
  setReady(key: string, tex: WebGLTexture, width: number, height: number, frame: number): void;
  getGL(): WebGLRenderingContext;
  getFrame(): number;
  requestRender(): void;
  getUseImageBitmap(): boolean;
  setUseImageBitmap(v: boolean): void;
};

export function startImageLoad(deps: TileLoaderDeps, { key, url }: TileTask) {
  deps.addPending(key);
  deps.incInflight();
  deps.setLoading(key);

  const onFinally = () => {
    try { /* noop */ } finally {
      deps.removePending(key);
      deps.decInflight();
    }
  };

  if (deps.getUseImageBitmap()) {
    fetch(url, { mode: 'cors', credentials: 'omit' })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); })
      .then((blob) => createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }))
      .then((bmp) => {
        try {
          const gl: WebGLRenderingContext = deps.getGL();
          const tex = gl.createTexture();
          if (!tex) { deps.setError(key); return; }
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
          gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp as any);
          gl.generateMipmap(gl.TEXTURE_2D);
          deps.setReady(key, tex, (bmp as any).width, (bmp as any).height, deps.getFrame());
          deps.requestRender();
        } finally {
          try { (bmp as any).close?.(); } catch {}
          onFinally();
        }
      })
      .catch(() => { deps.setUseImageBitmap(false); startImageLoad(deps, { key, url }); });
    return;
  }

  const img = new Image();
  (img as any).crossOrigin = 'anonymous';
  (img as any).decoding = 'async';
  img.onload = () => {
    try {
      const gl: WebGLRenderingContext = deps.getGL();
      const tex = gl.createTexture();
      if (!tex) { deps.setError(key); return; }
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img as any);
      gl.generateMipmap(gl.TEXTURE_2D);
      deps.setReady(key, tex, (img as any).naturalWidth, (img as any).naturalHeight, deps.getFrame());
      deps.requestRender();
    } finally {
      onFinally();
    }
  };
  img.onerror = () => { deps.setError(key); onFinally(); };
  img.src = url;
}
