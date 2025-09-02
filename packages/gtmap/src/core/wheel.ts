// Wheel normalization helper extracted from GTMap

export function normalizeWheel(e: WheelEvent, canvasHeight: number): number {
  const lineHeight = 16; // px baseline for converting pixels to lines
  if (e.deltaMode === 1) return e.deltaY; // lines
  if (e.deltaMode === 2) return (e.deltaY * canvasHeight) / lineHeight; // pages -> lines-ish
  return e.deltaY / lineHeight; // pixels -> lines
}

