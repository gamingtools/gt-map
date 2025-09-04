export function chooseGridSpacing(scale: number, tileSize: number): number {
  const base = tileSize;
  const candidates = [
    base / 16,
    base / 8,
    base / 4,
    base / 2,
    base,
    base * 2,
    base * 4,
    base * 8,
    base * 16,
    base * 32,
    base * 64,
  ];
  const targetPx = 100;
  let best = candidates[0];
  let bestErr = Infinity;
  for (const w of candidates) {
    const css = w * scale;
    const err = Math.abs(css - targetPx);
    if (err < bestErr) {
      bestErr = err;
      best = w;
    }
  }
  return Math.max(1, Math.round(best));
}

export function drawGrid(
  ctx: CanvasRenderingContext2D | null,
  canvas: HTMLCanvasElement | null,
  zInt: number,
  scale: number,
  widthCSS: number,
  heightCSS: number,
  tlWorld: { x: number; y: number },
  dpr: number,
  maxZoom: number,
  tileSize: number,
): void {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, (canvas as any).width, (canvas as any).height);
  ctx.save();
  ctx.scale(dpr || 1, dpr || 1);
  const spacingWorld = chooseGridSpacing(scale, tileSize);
  const base = tileSize;
  const zAbs = Math.floor(maxZoom);
  const factorAbs = Math.pow(2, zAbs - zInt);
  ctx.font =
    '11px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  let startWX = Math.floor(tlWorld.x / spacingWorld) * spacingWorld;
  for (let wx = startWX; (wx - tlWorld.x) * scale <= widthCSS + spacingWorld * scale; wx += spacingWorld) {
    const xCSS = (wx - tlWorld.x) * scale;
    const isMajor = Math.round(wx) % base === 0;
    ctx.beginPath();
    ctx.strokeStyle = isMajor ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.2)';
    ctx.lineWidth = isMajor ? 1.0 : 0.6;
    ctx.moveTo(Math.round(xCSS) + 0.5, 0);
    ctx.lineTo(Math.round(xCSS) + 0.5, heightCSS);
    ctx.stroke();
    if (isMajor) {
      const xAbs = Math.round(wx * factorAbs);
      const label = `x ${xAbs}`;
      const tx = Math.round(xCSS) + 2;
      const ty = 2;
      const m = ctx.measureText(label);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(tx - 2, ty - 1, (m as any).width + 4, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(label, tx, ty);
    }
  }
  let startWY = Math.floor(tlWorld.y / spacingWorld) * spacingWorld;
  for (let wy = startWY; (wy - tlWorld.y) * scale <= heightCSS + spacingWorld * scale; wy += spacingWorld) {
    const yCSS = (wy - tlWorld.y) * scale;
    const isMajor = Math.round(wy) % base === 0;
    ctx.beginPath();
    ctx.strokeStyle = isMajor ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.2)';
    ctx.lineWidth = isMajor ? 1.0 : 0.6;
    ctx.moveTo(0, Math.round(yCSS) + 0.5);
    ctx.lineTo(widthCSS, Math.round(yCSS) + 0.5);
    ctx.stroke();
    if (isMajor) {
      const yAbs = Math.round(wy * factorAbs);
      const label = `y ${yAbs}`;
      const tx = 2;
      const ty = Math.round(yCSS) + 2;
      const m = ctx.measureText(label);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(tx - 2, ty - 1, (m as any).width + 4, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(label, tx, ty);
    }
  }
  ctx.restore();
}

