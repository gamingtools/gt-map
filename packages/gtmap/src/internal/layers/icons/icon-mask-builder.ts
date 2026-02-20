export type MaskSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;

export class IconMaskBuilder {
	private maskAlpha = new Map<string, { data: Uint8Array; w: number; h: number }>();
	private pending: Array<{ key: string; src: MaskSource; w: number; h: number; crop?: { sx: number; sy: number; sw: number; sh: number } }> = [];
	private started = false;
	private processingScheduled = false;

	/** Reset all state to allow fresh mask building after a full icon reload. */
	reset(): void {
		this.maskAlpha.clear();
		this.pending = [];
		this.started = false;
		this.processingScheduled = false;
	}

	enqueue(key: string, src: MaskSource, w: number, h: number, crop?: { sx: number; sy: number; sw: number; sh: number }): void {
		// Replace older queued work for the same key and invalidate any previously built mask.
		this.maskAlpha.delete(key);
		for (let i = this.pending.length - 1; i >= 0; i--) {
			if (this.pending[i]!.key === key) this.pending.splice(i, 1);
		}
		const stableSrc = this.materializeSource(src);
		this.pending.push(crop ? { key, src: stableSrc, w, h, crop } : { key, src: stableSrc, w, h });
		if (this.started) this.schedule();
	}

	remove(key: string): void {
		this.maskAlpha.delete(key);
		for (let i = this.pending.length - 1; i >= 0; i--) {
			if (this.pending[i]!.key === key) this.pending.splice(i, 1);
		}
	}

	getMaskInfo(key: string): { data: Uint8Array; w: number; h: number } | null {
		return this.maskAlpha.get(key) || null;
	}

	start(): void {
		if (!this.started) this.started = true;
		this.schedule();
	}

	private schedule(): void {
		if (this.processingScheduled || this.pending.length === 0) return;
		this.processingScheduled = true;
		const w = window as { requestIdleCallback?: (cb: () => void) => number };
		const ric: ((cb: () => void) => number) | undefined = typeof w.requestIdleCallback === 'function' ? w.requestIdleCallback.bind(window) : undefined;
		const process = () => {
			this.processingScheduled = false;
			let budget = 3;
			while (budget-- > 0 && this.pending.length) {
				const it = this.pending.shift()!;
				this.buildMaskSafe(it.key, it.src, it.w, it.h, it.crop);
			}
			this.schedule();
		};
		if (typeof ric === 'function') ric(process);
		else setTimeout(process, 0);
	}

	private buildMaskSafe(key: string, src: MaskSource, w: number, h: number, crop?: { sx: number; sy: number; sw: number; sh: number }) {
		try {
			const cnv = document.createElement('canvas');
			cnv.width = Math.max(1, w | 0);
			cnv.height = Math.max(1, h | 0);
			const ctx = cnv.getContext('2d');
			if (!ctx) return;
			ctx.clearRect(0, 0, cnv.width, cnv.height);
			const srcSize = this.getSourceSize(src);
			const sw = crop ? crop.sw : srcSize.width;
			const sh = crop ? crop.sh : srcSize.height;
			const sx = crop ? crop.sx : 0;
			const sy = crop ? crop.sy : 0;
			try {
				ctx.drawImage(src as CanvasImageSource, sx, sy, sw, sh, 0, 0, w, h);
			} catch {}
			const img = ctx.getImageData(0, 0, w, h);
			const rgba = img.data;
			const data = new Uint8Array(w * h);
			for (let i = 0, j = 0; i < rgba.length; i += 4, j++) data[j] = rgba[i + 3]!;
			this.maskAlpha.set(key, { data, w, h });
		} catch {
			// Likely CORS taint; skip mask for this icon
		}
	}

	private materializeSource(src: MaskSource): MaskSource {
		// Copy ImageBitmap into a canvas so callers can safely close() the bitmap.
		if (typeof ImageBitmap !== 'undefined' && src instanceof ImageBitmap) {
			const canvas = document.createElement('canvas');
			canvas.width = Math.max(1, src.width | 0);
			canvas.height = Math.max(1, src.height | 0);
			const ctx = canvas.getContext('2d');
			if (ctx) {
				try {
					ctx.drawImage(src, 0, 0);
				} catch {
					/* expected: draw may fail for invalid bitmap */
				}
			}
			return canvas;
		}
		return src;
	}

	private getSourceSize(src: MaskSource): { width: number; height: number } {
		const candidate = src as Partial<{
			width: number;
			height: number;
			naturalWidth: number;
			naturalHeight: number;
			videoWidth: number;
			videoHeight: number;
		}>;

		if (typeof candidate.naturalWidth === 'number' && typeof candidate.naturalHeight === 'number' && candidate.naturalWidth > 0 && candidate.naturalHeight > 0) {
			return { width: candidate.naturalWidth, height: candidate.naturalHeight };
		}
		if (typeof candidate.videoWidth === 'number' && typeof candidate.videoHeight === 'number' && candidate.videoWidth > 0 && candidate.videoHeight > 0) {
			return { width: candidate.videoWidth, height: candidate.videoHeight };
		}
		return {
			width: Math.max(1, Math.round(candidate.width ?? 1)),
			height: Math.max(1, Math.round(candidate.height ?? 1)),
		};
	}
}
