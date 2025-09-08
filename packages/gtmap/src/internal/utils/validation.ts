import { clamp } from './clamp';

/**
 * Validates and clamps a numeric value if it's finite
 * @param value - The value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param fallback - Optional fallback value if validation fails
 * @returns The clamped value if valid, fallback if provided, or undefined
 */
export function validateNumber(value: unknown, min: number, max: number, fallback?: number): number | undefined {
  if (Number.isFinite(value)) {
    return clamp(value as number, min, max);
  }
  return fallback;
}

/**
 * Validates and clamps a numeric value, returning the original if invalid
 * @param value - The value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param original - The original value to return if validation fails
 * @returns The clamped value if valid, or the original value
 */
export function validateOrKeep(value: unknown, min: number, max: number, original: number): number {
  if (Number.isFinite(value)) {
    return clamp(value as number, min, max);
  }
  return original;
}

/**
 * Sets a property if the value is valid and finite
 * @param target - The target object
 * @param prop - The property name
 * @param value - The value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns True if the value was set, false otherwise
 */
export function setIfValid<T extends object, K extends keyof T>(
  target: T,
  prop: K,
  value: unknown,
  min: number,
  max: number
): boolean {
  if (Number.isFinite(value)) {
    target[prop] = clamp(value as number, min, max) as T[K];
    return true;
  }
  return false;
}