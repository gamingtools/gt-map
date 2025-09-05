export const DEBUG = false;

declare global {
	// Expose a global DEBUG flag for optional runtime logging without casts
	// It may be undefined in production builds.
	var DEBUG: boolean | undefined;
}

try {
	globalThis.DEBUG = DEBUG;
} catch {}
