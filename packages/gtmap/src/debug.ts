export const DEBUG = false;
try {
	(globalThis as any).DEBUG = DEBUG;
} catch {}
