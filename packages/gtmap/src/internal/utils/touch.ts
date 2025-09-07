export function extractTouchPair(e: TouchEvent): { t0: Touch; t1: Touch; dx: number; dy: number } | null {
  if (e.touches.length < 2) return null;
  const t0 = e.touches[0];
  const t1 = e.touches[1];
  const dx = t1.clientX - t0.clientX;
  const dy = t1.clientY - t0.clientY;
  return { t0, t1, dx, dy };
}

export function touchMidpoint(t0: Touch, t1: Touch, rect: DOMRect): { x: number; y: number } {
  return {
    x: (t0.clientX + t1.clientX) / 2 - rect.left,
    y: (t0.clientY + t1.clientY) / 2 - rect.top,
  };
}

