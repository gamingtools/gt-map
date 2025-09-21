export class FrameLoop {
	private raf: number | null = null;
	private lastFrameAt: number | null = null;
	private loopBound: ((ts: number) => void) | null = null;

	private lastTs: number | null = null;
	private emaDt = 1000 / 60;
	private virtualNow = 0;

	private readonly alpha = 0.2;
	private readonly maxDelta = 1000 / 24;
	private readonly minDelta = 1000 / 144;
	private readonly pauseResetMs = 250;

	constructor(
		private getTargetFps: () => number,
		private tick: (now: number, allowRender: boolean) => void,
	) {}

	start() {
		if (this.raf != null) return;
		this.loopBound = (ts: number) => this.loop(ts);
		this.raf = requestAnimationFrame(this.loopBound);
	}

	stop() {
		if (this.raf != null) {
			try {
				cancelAnimationFrame(this.raf);
			} catch {}
			this.raf = null;
		}
		this.lastTs = null;
		this.lastFrameAt = null;
	}

	private loop(ts: number) {
		if (this.loopBound == null) return;
		this.raf = requestAnimationFrame(this.loopBound);

		const realNow = ts;
		const minInterval = this.getBaselineFrameDuration();
		const sinceLast = this.lastFrameAt == null ? Infinity : realNow - this.lastFrameAt;
		const allowRender = sinceLast >= minInterval - 0.5;

		if (this.lastTs == null) {
			this.resetSmoothing(realNow);
			this.tick(this.virtualNow, allowRender);
			if (allowRender) this.lastFrameAt = realNow;
			return;
		}

		let rawDt = realNow - this.lastTs;
		this.lastTs = realNow;

		if (rawDt > this.pauseResetMs) {
			this.resetSmoothing(realNow);
			this.tick(this.virtualNow, allowRender);
			if (allowRender) this.lastFrameAt = realNow;
			return;
		}

		if (rawDt < this.minDelta) {
			rawDt = this.minDelta;
		} else if (rawDt > this.maxDelta) {
			rawDt = this.maxDelta;
		}

		this.emaDt += this.alpha * (rawDt - this.emaDt);
		this.virtualNow += this.emaDt;

		this.tick(this.virtualNow, allowRender);
		if (allowRender) this.lastFrameAt = realNow;
	}

	private resetSmoothing(baseTs: number) {
		this.lastTs = baseTs;
		this.virtualNow = baseTs;
		this.emaDt = this.getBaselineFrameDuration();
	}

	private getBaselineFrameDuration(): number {
		const fps = Math.max(1, this.getTargetFps());
		return 1000 / fps;
	}
}
