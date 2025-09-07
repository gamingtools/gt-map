import { HIT_TEST } from './constants';

export interface AlphaMask {
  data: Uint8Array;
  w: number;
  h: number;
}

/**
 * Sample an alpha mask after rotating a pointer-relative local coordinate around an anchor.
 * Returns true when the sampled alpha is above the configured threshold.
 */
export function alphaMaskHit(params: {
  pointerLocalX: number;
  pointerLocalY: number;
  iconWidth: number;
  iconHeight: number;
  anchorX: number;
  anchorY: number;
  iconRotationDeg?: number;
  mask: AlphaMask;
  threshold?: number;
}): boolean {
  const { pointerLocalX, pointerLocalY, iconWidth, iconHeight, anchorX, anchorY, iconRotationDeg, mask } = params;
  const theta = ((iconRotationDeg || 0) * Math.PI) / 180;
  const c = Math.cos(-theta), s = Math.sin(-theta);
  const cx = pointerLocalX - anchorX;
  const cy = pointerLocalY - anchorY;
  const rx = cx * c - cy * s + anchorX;
  const ry = cx * s + cy * c + anchorY;
  if (rx < 0 || ry < 0 || rx >= iconWidth || ry >= iconHeight) return false;
  const mx = Math.max(0, Math.min(mask.w - 1, Math.floor((rx / iconWidth) * mask.w)));
  const my = Math.max(0, Math.min(mask.h - 1, Math.floor((ry / iconHeight) * mask.h)));
  const alpha = mask.data[my * mask.w + mx] | 0;
  const THRESH = Math.max(0, Math.floor(params.threshold ?? HIT_TEST.ALPHA_THRESHOLD));
  return alpha >= THRESH;
}

/**
 * Inverse-rotate a screen-space point around a center by a bearing (radians).
 * Returns the unrotated screen-space coordinates.
 */
export function unrotatePoint(px: number, py: number, cx: number, cy: number, bearingRad: number): { x: number; y: number } {
  if (!bearingRad) return { x: px, y: py };
  const dx = px - cx, dy = py - cy;
  const s = Math.sin(-bearingRad), c = Math.cos(-bearingRad);
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

