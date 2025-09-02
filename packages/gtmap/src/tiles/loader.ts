// Tile image loader and texture upload utilities extracted from GTMap
// Internal module, uses a flexible `map` shape to avoid tight coupling.

export type TileTask = { key: string; url: string };

export function startImageLoad(map: any, { key, url }: TileTask) {
  map._pendingKeys.add(key);
  map._inflightLoads++;
  map._tileCache.setLoading(key);

  const onFinally = () => {
    try { /* noop */ } finally {
      map._pendingKeys.delete(key);
      map._inflightLoads = Math.max(0, map._inflightLoads - 1);
      map._processLoadQueue();
    }
  };

  if (map.useImageBitmap) {
    fetch(url, { mode: 'cors', credentials: 'omit' })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); })
      .then((blob) => createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }))
      .then((bmp) => {
        try {
          const gl: WebGLRenderingContext = map.gl;
          const tex = gl.createTexture();
          if (!tex) { map._tileCache.setError(key); return; }
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
          gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp as any);
          gl.generateMipmap(gl.TEXTURE_2D);
          map._tileCache.setReady(key, tex, (bmp as any).width, (bmp as any).height, map._frame);
          map._needsRender = true;
        } finally {
          try { (bmp as any).close?.(); } catch {}
          onFinally();
        }
      })
      .catch(() => { map.useImageBitmap = false; startImageLoad(map, { key, url }); });
    return;
  }

  const img = new Image();
  (img as any).crossOrigin = 'anonymous';
  (img as any).decoding = 'async';
  img.onload = () => {
    try {
      const gl: WebGLRenderingContext = map.gl;
      const tex = gl.createTexture();
      if (!tex) { map._tileCache.setError(key); return; }
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img as any);
      gl.generateMipmap(gl.TEXTURE_2D);
      map._tileCache.setReady(key, tex, (img as any).naturalWidth, (img as any).naturalHeight, map._frame);
      map._needsRender = true;
    } finally {
      onFinally();
    }
  };
  img.onerror = () => { map._tileCache.setError(key); onFinally(); };
  img.src = url;
}

