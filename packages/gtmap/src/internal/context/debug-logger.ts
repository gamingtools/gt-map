/**
 * DebugLogger -- centralized debug logging utility.
 * Replaces the _log/_warn/_gpuWaitEnabled methods scattered on mapgl.ts.
 */
export class DebugLogger {
	private _enabled: boolean;
	private _t0Ms: number;

	constructor(enabled: boolean) {
		this._enabled = enabled;
		this._t0Ms = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
	}

	get enabled(): boolean {
		return this._enabled;
	}

	setEnabled(on: boolean): void {
		this._enabled = on;
	}

	log(msg: string): void {
		if (!this._enabled) return;
		try {
			const t = this.now() - this._t0Ms;
			console.log(`[GTMap t=${t.toFixed(1)}ms] ${msg}`);
		} catch {}
	}

	warn(context: string, err?: unknown): void {
		if (!this._enabled) return;
		const msg = err instanceof Error ? err.message : String(err ?? '');
		console.warn(`[GTMap] ${context}${msg ? ': ' + msg : ''}`);
	}

	gpuWaitEnabled(): boolean {
		try {
			return typeof localStorage !== 'undefined' && localStorage.getItem('GTMAP_DEBUG_GPUWAIT') === '1';
		} catch {
			return false;
		}
	}

	now(): number {
		return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
	}
}
