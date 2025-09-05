// Minimal feature flags subset for plugin heuristics

export const Browser = {
  retina: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) > 1 : false,
  touch: typeof window !== 'undefined' ? ('ontouchstart' in window || (navigator as any).maxTouchPoints > 0) : false,
  pointer: typeof window !== 'undefined' ? ('PointerEvent' in window) : false,
  msPointer: false,
  mac: typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform || '') : false,
};

