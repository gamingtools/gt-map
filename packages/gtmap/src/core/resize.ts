export function resize(map: any) {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
  const rect = map.container.getBoundingClientRect();
  map.canvas.style.width = rect.width + 'px';
  map.canvas.style.height = rect.height + 'px';
  const w = Math.max(1, Math.floor(rect.width * dpr));
  const h = Math.max(1, Math.floor(rect.height * dpr));
  if (map.canvas.width !== w || map.canvas.height !== h) {
    map.canvas.width = w;
    map.canvas.height = h;
    map._dpr = dpr;
    map.gl.viewport(0, 0, w, h);
    map._needsRender = true;
  }
  if (map.gridCanvas) {
    map.gridCanvas.style.width = rect.width + 'px';
    map.gridCanvas.style.height = rect.height + 'px';
    if (map.gridCanvas.width !== w || map.gridCanvas.height !== h) {
      map.gridCanvas.width = w; map.gridCanvas.height = h; map._needsRender = true;
    }
  }
}

