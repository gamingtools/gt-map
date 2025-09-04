export class FrameLoop {
	private raf: number | null = null;
	private lastFrameAt: number | null = null;
	private loopBound: (() => void) | null = null;

	constructor(
		private getTargetFps: () => number,
		private tick: (now: number, allowRender: boolean) => void,
	) {}

	start() {
		if (this.raf != null) return;
		this.loopBound = this.loop.bind(this);
		this.raf = requestAnimationFrame(this.loopBound);
	}

	stop() {
		if (this.raf != null) {
			try {
				cancelAnimationFrame(this.raf);
			} catch {}
			this.raf = null;
		}
		this.lastFrameAt = null;
	}

	private loop() {
		this.raf = requestAnimationFrame(this.loopBound as () => void);
		const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
		const minInterval = 1000 / Math.max(1, this.getTargetFps());
		const sinceLast = this.lastFrameAt == null ? Infinity : now - this.lastFrameAt;
		const allowRender = sinceLast >= minInterval - 0.5;
		this.tick(now, allowRender);
		if (allowRender) this.lastFrameAt = now;
	}
}
