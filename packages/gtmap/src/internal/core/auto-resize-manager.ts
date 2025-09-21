export interface AutoResizeDeps {
	getContainer(): HTMLElement;
	onResize(): void; // call to perform actual resize/render adjustments
	getDebounceMs(): number;
}

export default class AutoResizeManager {
	private deps: AutoResizeDeps;
	private ro: ResizeObserver | null = null;
	private timer: number | null = null;

	constructor(deps: AutoResizeDeps) {
		this.deps = deps;
	}

	attach(): void {
		try {
			if (typeof window !== 'undefined') window.addEventListener('resize', this.onWindowResize);
			if (typeof ResizeObserver !== 'undefined') {
				this.ro = new ResizeObserver(() => this.scheduleTrailing());
				this.ro.observe(this.deps.getContainer());
			}
		} catch {}
	}

	detach(): void {
		try {
			if (typeof window !== 'undefined') window.removeEventListener('resize', this.onWindowResize);
			this.ro?.disconnect();
		} catch {}
		this.ro = null;
		if (this.timer != null) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}

	private onWindowResize = () => this.scheduleTrailing();

	private scheduleTrailing(): void {
		if (this.timer != null) clearTimeout(this.timer);
		const fire = () => {
			this.timer = null;
			const run = () => this.deps.onResize();
			if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
			else run();
		};
		const ms = Math.max(0, this.deps.getDebounceMs());
		this.timer = window.setTimeout(fire, ms);
	}
}
