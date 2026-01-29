/**
 * BackgroundUIManager handles background color parsing, loading spinner,
 * and grid palette for the map.
 */

export interface SpinnerOptions {
	size: number;
	thickness: number;
	color: string;
	trackColor: string;
	speedMs: number;
}

export interface BackgroundUIDeps {
	getContainer(): HTMLDivElement;
	getCanvas(): HTMLCanvasElement;
}

export class BackgroundUIManager {
	private _bg = { r: 0, g: 0, b: 0, a: 0 };
	private _showLoading = true;
	private _loadingEl: HTMLDivElement | null = null;
	private static _spinnerCssInjected = false;
	private _spinner: SpinnerOptions = {
		size: 32,
		thickness: 3,
		color: 'rgba(0,0,0,0.6)',
		trackColor: 'rgba(0,0,0,0.2)',
		speedMs: 1000,
	};

	constructor(private deps: BackgroundUIDeps) {}

	/**
	 * Parse and set the background color.
	 * Policy: if omitted or 'transparent' => fully transparent; otherwise use solid color (alpha forced to 1)
	 */
	parseBackground(input?: string | { r: number; g: number; b: number; a?: number }): void {
		const transparent = { r: 0, g: 0, b: 0, a: 0 };
		const toSolid = (str: string) => {
			const s = str.trim().toLowerCase();
			if (s === 'transparent') return transparent;
			const m = s.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
			if (m) {
				const hex = m[1]!;
				const rr = parseInt(hex.slice(0, 2), 16) / 255;
				const gg = parseInt(hex.slice(2, 4), 16) / 255;
				const bb = parseInt(hex.slice(4, 6), 16) / 255;
				return { r: rr, g: gg, b: bb, a: 1 };
			}
			return transparent;
		};
		let bg = transparent;
		if (typeof input === 'string') bg = toSolid(input);
		else if (input && typeof input.r === 'number' && typeof input.g === 'number' && typeof input.b === 'number') {
			bg = {
				r: Math.max(0, Math.min(1, input.r / (input.r > 1 ? 255 : 1))),
				g: Math.max(0, Math.min(1, input.g / (input.g > 1 ? 255 : 1))),
				b: Math.max(0, Math.min(1, input.b / (input.b > 1 ? 255 : 1))),
				a: 1,
			};
		}
		this._bg = bg;
		try {
			// For alpha < 1 (only 'transparent' case), keep the element background transparent so the page can show through
			// and let the WebGL clear color's alpha drive compositing (alpha will be 0 in that case).
			const canvas = this.deps.getCanvas();
			canvas.style.backgroundColor = bg.a < 1 ? 'transparent' : `rgb(${Math.round(bg.r * 255)}, ${Math.round(bg.g * 255)}, ${Math.round(bg.b * 255)})`;
		} catch {}
	}

	/**
	 * Get the current background color (normalized 0..1).
	 */
	getBackground(): { r: number; g: number; b: number; a: number } {
		return { ...this._bg };
	}

	/**
	 * Inject the spinner CSS keyframes if not already done.
	 */
	ensureSpinnerCss(): void {
		if (BackgroundUIManager._spinnerCssInjected) return;
		try {
			const style = document.createElement('style');
			style.textContent = `@keyframes gtmap_spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
			document.head.appendChild(style);
			BackgroundUIManager._spinnerCssInjected = true;
		} catch {}
	}

	/**
	 * Set spinner options.
	 */
	setSpinnerOptions(opts: Partial<SpinnerOptions>): void {
		this._spinner = {
			size: Math.max(4, Math.floor(opts.size ?? this._spinner.size)),
			thickness: Math.max(1, Math.floor(opts.thickness ?? this._spinner.thickness)),
			color: opts.color ?? this._spinner.color,
			trackColor: opts.trackColor ?? this._spinner.trackColor,
			speedMs: Math.max(100, Math.floor(opts.speedMs ?? this._spinner.speedMs)),
		};
	}

	/**
	 * Create the loading overlay element.
	 */
	createLoadingEl(): void {
		if (!this._showLoading || this._loadingEl) return;
		try {
			const container = this.deps.getContainer();
			const wrap = document.createElement('div');
			Object.assign(wrap.style, {
				position: 'absolute',
				left: '0',
				top: '0',
				right: '0',
				bottom: '0',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				pointerEvents: 'none',
				zIndex: '10',
			} as CSSStyleDeclaration);
			const spinner = document.createElement('div');
			const { size, thickness, color, trackColor, speedMs } = this._spinner;
			Object.assign(spinner.style, {
				width: `${size}px`,
				height: `${size}px`,
				border: `${thickness}px solid ${trackColor}`,
				borderTopColor: color,
				borderRadius: '50%',
				animation: `gtmap_spin ${speedMs}ms linear infinite`,
			} as CSSStyleDeclaration);
			wrap.appendChild(spinner);
			// Ensure container is positioned
			const cs = getComputedStyle(container);
			if (cs.position === 'static' || !cs.position) container.style.position = 'relative';
			container.appendChild(wrap);
			this._loadingEl = wrap;
			this.setLoadingVisible(false);
		} catch {}
	}

	/**
	 * Show or hide the loading overlay.
	 */
	setLoadingVisible(on: boolean): void {
		this._loadingEl && (this._loadingEl.style.display = on ? 'flex' : 'none');
	}

	/**
	 * Set whether loading indicator should be shown.
	 */
	setShowLoading(show: boolean): void {
		this._showLoading = show;
	}

	/**
	 * Get whether loading indicator should be shown.
	 */
	getShowLoading(): boolean {
		return this._showLoading;
	}

	/**
	 * Choose contrasting grid colors based on background luminance.
	 */
	getGridPalette(): { minor: string; major: string; labelBg: string; labelFg: string } {
		const L = 0.2126 * this._bg.r + 0.7152 * this._bg.g + 0.0722 * this._bg.b;
		const lightBg = L >= 0.5;
		if (lightBg) {
			return { minor: 'rgba(0,0,0,0.2)', major: 'rgba(0,0,0,0.45)', labelBg: 'rgba(0,0,0,0.55)', labelFg: 'rgba(255,255,255,0.9)' };
		}
		return { minor: 'rgba(255,255,255,0.25)', major: 'rgba(255,255,255,0.55)', labelBg: 'rgba(255,255,255,0.75)', labelFg: 'rgba(0,0,0,0.9)' };
	}

	/**
	 * Clean up the loading element.
	 */
	dispose(): void {
		if (this._loadingEl) {
			try {
				this._loadingEl.remove();
			} catch {}
			this._loadingEl = null;
		}
	}
}
