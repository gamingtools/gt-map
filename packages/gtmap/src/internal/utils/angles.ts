export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

export function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function degToRad(degrees: number | undefined | null): number {
  return (typeof degrees === 'number' ? degrees : 0) * DEG_TO_RAD;
}

