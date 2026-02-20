export type MaskSource = ImageBitmap | HTMLImageElement;

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
		this.pending.push(crop ? { key, src, w, h, crop } : { key, src, w, h });
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
			const sw = crop ? crop.sw : 'width' in src ? (src as ImageBitmap).width : (src as HTMLImageElement).naturalWidth;
			const sh = crop ? crop.sh : 'height' in src ? (src as ImageBitmap).height : (src as HTMLImageElement).naturalHeight;
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
}
