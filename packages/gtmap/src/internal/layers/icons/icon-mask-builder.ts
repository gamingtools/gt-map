export type MaskSource = ImageBitmap | HTMLImageElement;

export class IconMaskBuilder {
  private maskAlpha = new Map<string, { data: Uint8Array; w: number; h: number }>();
  private pending: Array<{ key: string; src: MaskSource; w: number; h: number }> = [];
  private started = false;

  enqueue(key: string, src: MaskSource, w: number, h: number): void {
    this.pending.push({ key, src, w, h });
  }

  getMaskInfo(key: string): { data: Uint8Array; w: number; h: number } | null {
    return this.maskAlpha.get(key) || null;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    const w = window as { requestIdleCallback?: (cb: () => void) => number };
    const ric: ((cb: () => void) => number) | undefined = typeof w.requestIdleCallback === 'function' ? w.requestIdleCallback.bind(window) : undefined;
    const process = () => {
      let budget = 3;
      while (budget-- > 0 && this.pending.length) {
        const it = this.pending.shift()!;
        if (!this.maskAlpha.has(it.key)) this.buildMaskSafe(it.key, it.src, it.w, it.h);
      }
      if (this.pending.length) {
        if (typeof ric === 'function') ric(process);
        else setTimeout(process, 0);
      }
    };
    if (typeof ric === 'function') ric(process);
    else setTimeout(process, 0);
  }

  private buildMaskSafe(key: string, src: MaskSource, w: number, h: number) {
    try {
      const cnv = document.createElement('canvas');
      cnv.width = Math.max(1, w | 0);
      cnv.height = Math.max(1, h | 0);
      const ctx = cnv.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, cnv.width, cnv.height);
      const sw = 'width' in src ? (src as ImageBitmap).width : (src as HTMLImageElement).naturalWidth;
      const sh = 'height' in src ? (src as ImageBitmap).height : (src as HTMLImageElement).naturalHeight;
      try {
        ctx.drawImage(src as CanvasImageSource, 0, 0, sw, sh, 0, 0, w, h);
      } catch {}
      const img = ctx.getImageData(0, 0, w, h);
      const rgba = img.data;
      const data = new Uint8Array(w * h);
      for (let i = 0, j = 0; i < rgba.length; i += 4, j++) data[j] = rgba[i + 3];
      this.maskAlpha.set(key, { data, w, h });
    } catch {
      // Likely CORS taint; skip mask for this icon
    }
  }
}
