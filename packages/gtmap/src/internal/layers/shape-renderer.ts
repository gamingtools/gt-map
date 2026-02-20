/**
 * Shape-to-texture renderer for CircleVisual and RectVisual.
 *
 * Renders shapes to an offscreen canvas at 2x scale (retina) and returns
 * the image data for use as a marker icon texture.
 */

export interface CircleRenderOptions {
  radius: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface RectRenderOptions {
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
}

export interface ShapeRenderResult {
  /** The rendered canvas (can be used as CanvasImageSource). */
  canvas: HTMLCanvasElement;
  /** Canvas pixel width (at 2x scale). */
  width: number;
  /** Canvas pixel height (at 2x scale). */
  height: number;
}

/**
 * Render a circle to a canvas and return the result.
 * Canvas is sized at 2x for retina sharpness.
 */
export function renderCircleToCanvas(options: CircleRenderOptions): ShapeRenderResult {
  const { radius, fill, stroke, strokeWidth = 0 } = options;
  const scale = 2;
  const pad = strokeWidth;
  const diameter = radius * 2;
  const w = diameter + pad * 2;
  const h = diameter + pad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w * scale);
  canvas.height = Math.ceil(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, width: w * scale, height: h * scale };
  ctx.scale(scale, scale);

  const cx = w / 2;
  const cy = h / 2;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }

  if (stroke && strokeWidth > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }

  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Render a rectangle to a canvas and return the result.
 * Canvas is sized at 2x for retina sharpness.
 */
export function renderRectToCanvas(options: RectRenderOptions): ShapeRenderResult {
  const { width, height, fill, stroke, strokeWidth = 0, borderRadius = 0 } = options;
  const scale = 2;
  const pad = strokeWidth;
  const w = width + pad * 2;
  const h = height + pad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w * scale);
  canvas.height = Math.ceil(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, width: w * scale, height: h * scale };
  ctx.scale(scale, scale);

  const x = pad;
  const y = pad;

  ctx.beginPath();
  if (borderRadius > 0) {
    const r = Math.min(borderRadius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  } else {
    ctx.rect(x, y, width, height);
  }

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }

  if (stroke && strokeWidth > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }

  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
  };
}
