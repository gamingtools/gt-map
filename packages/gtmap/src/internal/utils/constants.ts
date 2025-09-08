export const HIT_TEST = {
  ALPHA_THRESHOLD: 32, // ~12.5% opacity
} as const;

export const INTERACTION = {
  CLICK_TIMEOUT_MS: 400,
  LONGPRESS_MS: 500,
} as const;

export const ANIMATION = {
  DEFAULT_DURATION_MS: 600,
  FRAME_BUDGET_MS: 16,
} as const;

export const INERTIA = {
  DECELERATION_DEFAULT: 3400, // px/s^2
  DECELERATION_TOUCH: 1400, // px/s^2 for touch
  MAX_SPEED_DEFAULT: 6000, // px/s
  MIN_DECELERATION: 100, // px/s^2
  MAX_DECELERATION: 20000, // px/s^2
  MIN_MAX_SPEED: 10, // px/s
  MAX_MAX_SPEED: 1e6, // px/s
} as const;

export const RENDERING = {
  MIN_FPS: 15,
  MAX_FPS: 240,
  MAX_RGB_VALUE: 255,
  MIN_ZOOM_DELTA: 0.25,
} as const;

export const LIMITS = {
  MAX_PREFETCH_RING: 8,
  MIN_WHEEL_SPEED: 0.01,
  MAX_WHEEL_SPEED: 2,
  MIN_EASE_LINEARITY: 0.01,
  MAX_EASE_LINEARITY: 1.0,
} as const;

