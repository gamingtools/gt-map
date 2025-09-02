export function initCanvas(map: any) {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    display: 'block',
    position: 'absolute',
    left: '0',
    top: '0',
    right: '0',
    bottom: '0',
    zIndex: '0',
  } as CSSStyleDeclaration);
  map.container.appendChild(canvas);
  map.canvas = canvas;
}

export function initGridCanvas(map: any) {
  const c = document.createElement('canvas');
  map.gridCanvas = c;
  c.style.display = 'block';
  c.style.position = 'absolute';
  c.style.left = '0'; c.style.top = '0'; c.style.right = '0'; c.style.bottom = '0';
  c.style.zIndex = '5'; c.style.pointerEvents = 'none';
  map.container.appendChild(c);
  map._gridCtx = c.getContext('2d');
  c.style.display = map.showGrid ? 'block' : 'none';
}

export function setGridVisible(map: any, visible: boolean) {
  map.showGrid = !!visible;
  if (map.gridCanvas) {
    map.gridCanvas.style.display = map.showGrid ? 'block' : 'none';
    if (!map.showGrid) map._gridCtx?.clearRect(0, 0, map.gridCanvas.width, map.gridCanvas.height);
  }
  map._needsRender = true;
}

