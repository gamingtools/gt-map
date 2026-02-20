/**
 * Visual effects post-processor -- applies stroke and shadow to rasterized icon images.
 *
 * Works at the Canvas 2D rasterization stage, before atlas composition.
 * Consistent with how text-renderer and svg-renderer bake effects into textures.
 */

export interface VisualEffectsOptions {
  stroke?: string;
  strokeWidth?: number;
  shadow?: {
    color?: string;
    blur?: number;
    offsetX?: number;
    offsetY?: number;
  };
}

export interface VisualEffectsResult {
	/** The rendered canvas with effects applied. */
	canvas: HTMLCanvasElement;
	width: number;
	height: number;
}

/** Region within an atlas image to extract before applying effects. */
export interface SpriteRegion {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Apply stroke and/or shadow to an already-loaded image source.
 * Returns the canvas with the effects baked in at 2x scale for retina sharpness.
 */
export function applyVisualEffects(
	src: CanvasImageSource,
	srcW: number,
	srcH: number,
	opts: VisualEffectsOptions,
	region?: SpriteRegion,
): VisualEffectsResult {
	const scale = 2;
	const sw = opts.strokeWidth ?? 0;
	const shadow = opts.shadow;
	const sBlur = shadow?.blur ?? 0;
	const sOffX = shadow?.offsetX ?? 0;
	const sOffY = shadow?.offsetY ?? 2;

	// Compute padding needed for stroke and shadow
	const strokePad = sw;
	const shadowPadL = Math.max(0, sBlur - sOffX);
	const shadowPadR = Math.max(0, sBlur + sOffX);
	const shadowPadT = Math.max(0, sBlur - sOffY);
	const shadowPadB = Math.max(0, sBlur + sOffY);
	const padL = Math.max(strokePad, shadowPadL);
	const padR = Math.max(strokePad, shadowPadR);
	const padT = Math.max(strokePad, shadowPadT);
	const padB = Math.max(strokePad, shadowPadB);

	const outW = srcW + padL + padR;
	const outH = srcH + padT + padB;

	const canvas = document.createElement('canvas');
	canvas.width = Math.ceil(outW * scale);
	canvas.height = Math.ceil(outH * scale);
	const ctx = canvas.getContext('2d');
	if (!ctx) return { canvas, width: outW, height: outH };
	ctx.scale(scale, scale);

	const drawX = padL;
	const drawY = padT;

	// Source rect: either a sub-region (sprite) or the full image.
	const sourceSize = getSourceSize(src);
	const sx = region?.x ?? 0;
	const sy = region?.y ?? 0;
	const swidth = region?.width ?? sourceSize.width;
	const sheight = region?.height ?? sourceSize.height;

	// Helper: draw the source (or region) at a given offset.
	const drawSrc = (ox: number, oy: number) => {
		ctx.drawImage(src as CanvasImageSource, sx, sy, swidth, sheight, drawX + ox, drawY + oy, srcW, srcH);
	};

	// 1. Draw stroke (dilated outline) behind the image.
	if (opts.stroke && sw > 0) {
		ctx.save();
		const steps = Math.max(8, Math.ceil(sw * 4));
		for (let i = 0; i < steps; i++) {
			const angle = (i / steps) * Math.PI * 2;
			drawSrc(Math.cos(angle) * sw, Math.sin(angle) * sw);
		}
		ctx.globalCompositeOperation = 'source-in';
		ctx.fillStyle = opts.stroke;
		ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
		ctx.restore();
		ctx.globalCompositeOperation = 'source-over';
	}

	// 2. Apply shadow (via canvas shadow API) + draw original.
	if (shadow) {
		ctx.save();
		ctx.shadowColor = shadow.color ?? 'rgba(0,0,0,0.3)';
		ctx.shadowBlur = sBlur * scale;
		ctx.shadowOffsetX = sOffX * scale;
		ctx.shadowOffsetY = sOffY * scale;
		drawSrc(0, 0);
		ctx.restore();
	} else {
		// 3. Draw the original image on top (no shadow).
		drawSrc(0, 0);
	}

	return {
		canvas,
		width: canvas.width,
		height: canvas.height,
	};
}

/**
 * Async variant: loads an image from URL, applies effects, returns result via callback.
 * Optionally crops to a sprite region within the loaded image.
 */
export function applyVisualEffectsAsync(
	iconUrl: string,
	srcW: number,
	srcH: number,
	opts: VisualEffectsOptions,
	callback: (result: VisualEffectsResult) => void,
	region?: SpriteRegion,
): void {
	const img = new Image();
	img.crossOrigin = 'anonymous';
	img.onload = () => {
		try {
			const result = applyVisualEffects(img, srcW, srcH, opts, region);
			callback(result);
		} catch {
			const empty = document.createElement('canvas');
			empty.width = 0;
			empty.height = 0;
			callback({ canvas: empty, width: srcW, height: srcH });
		}
	};
	img.onerror = () => {
		const empty = document.createElement('canvas');
		empty.width = 0;
		empty.height = 0;
		callback({ canvas: empty, width: srcW, height: srcH });
	};
	img.src = iconUrl;
}

function getSourceSize(src: CanvasImageSource): { width: number; height: number } {
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
