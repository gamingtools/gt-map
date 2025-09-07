/**
 * Common easing functions for use with transitions.
 *
 * @remarks
 * All functions accept a normalized time `t` in the range [0, 1] and return a normalized progress in [0, 1].
 * Import as a namespace: `import { easings } from '@gaming.tools/gtmap'`.
 */

/** Linear easing. */
export function linear(t: number): number {
  return t;
}

/** Quadratic ease‑in. */
export function easeInQuad(t: number): number {
  return t * t;
}

/** Quadratic ease‑out. */
export function easeOutQuad(t: number): number {
  return t * (2 - t);
}

/** Quadratic ease‑in‑out. */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/** Cubic ease‑in. */
export function easeInCubic(t: number): number {
  return t * t * t;
}

/** Cubic ease‑out. */
export function easeOutCubic(t: number): number {
  const u = t - 1;
  return u * u * u + 1;
}

/** Cubic ease‑in‑out. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Exponential ease‑out. */
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
