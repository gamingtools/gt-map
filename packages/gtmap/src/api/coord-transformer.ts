export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

export type TransformType = 'original' | 'flipVertical' | 'flipHorizontal' | 'flipBoth' | 'rotate90CW' | 'rotate90CCW' | 'rotate180';

type FitMode = 'fit'; // reserved for future expansion (e.g., 'fill' | 'stretch')

/**
 * Coordinate transformer: maps source-space coordinates into image pixel space.
 *
 * Computes a uniform scale (fit) and centered offset so the full source bounds fit within
 * the target image dimensions while preserving aspect ratio.
 */
export class CoordTransformer {
	private src: Bounds;
	private dstW: number;
	private dstH: number;
	// reserved for future expansion
	private scale: number;
	private offX: number;
	private offY: number;

	constructor(targetWidth: number, targetHeight: number, source: Bounds, _mode: FitMode = 'fit') {
		this.dstW = Math.max(1, Math.floor(targetWidth));
		this.dstH = Math.max(1, Math.floor(targetHeight));
		this.src = source;
		const w = Math.max(1e-9, source.maxX - source.minX);
		const h = Math.max(1e-9, source.maxY - source.minY);
		const kx = this.dstW / w;
		const ky = this.dstH / h;
		// Uniform scale (letterbox/pillarbox) and center
		this.scale = Math.min(kx, ky);
		this.offX = (this.dstW - w * this.scale) * 0.5;
		this.offY = (this.dstH - h * this.scale) * 0.5;
	}

	/** Translate a source-space point to pixel coordinates using the given transform. */
	translate(x: number, y: number, type: TransformType = 'original'): { x: number; y: number } {
		const w = Math.max(1e-9, this.src.maxX - this.src.minX);
		const h = Math.max(1e-9, this.src.maxY - this.src.minY);
		// Normalize to [0,1] within the source bounds
		let u = (x - this.src.minX) / w;
		let v = (y - this.src.minY) / h;
		// Apply in-bounds normalization clamps to be safe
		// (not strictly required; callers can pass out-of-bounds on purpose)
		// u = Math.min(1, Math.max(0, u));
		// v = Math.min(1, Math.max(0, v));

		// Apply transform in normalized space
		switch (type) {
			case 'original':
				break;
			case 'flipVertical':
				v = 1 - v;
				break;
			case 'flipHorizontal':
				u = 1 - u;
				break;
			case 'flipBoth':
				u = 1 - u;
				v = 1 - v;
				break;
			case 'rotate90CW': {
				const u0 = u;
				u = 1 - v;
				v = u0;
				break;
			}
			case 'rotate90CCW': {
				const u0 = u;
				u = v;
				v = 1 - u0;
				break;
			}
			case 'rotate180':
				u = 1 - u;
				v = 1 - v;
				break;
		}

		// Map normalized coords back to source-sized, then into destination pixels
		const sx = u * w;
		const sy = v * h;
		const px = this.offX + sx * this.scale;
		const py = this.offY + sy * this.scale;
		return { x: px, y: py };
	}

	/** Update the destination image size (pixels). */
	setTargetSize(width: number, height: number): void {
		this.dstW = Math.max(1, Math.floor(width));
		this.dstH = Math.max(1, Math.floor(height));
		// Recompute scale/offset with the same source bounds
		const w = Math.max(1e-9, this.src.maxX - this.src.minX);
		const h = Math.max(1e-9, this.src.maxY - this.src.minY);
		const kx = this.dstW / w;
		const ky = this.dstH / h;
		this.scale = Math.min(kx, ky);
		this.offX = (this.dstW - w * this.scale) * 0.5;
		this.offY = (this.dstH - h * this.scale) * 0.5;
	}

	/** Replace the source bounds and recompute the mapping. */
	setSourceBounds(b: Bounds): void {
		this.src = b;
		this.setTargetSize(this.dstW, this.dstH);
	}
}
