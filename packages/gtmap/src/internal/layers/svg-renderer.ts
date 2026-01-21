/**
 * SVG-to-texture renderer for SvgVisual support.
 *
 * Renders SVG content to an offscreen canvas with optional color overrides
 * and shadow effects for use as a marker icon texture.
 *
 * Supports both synchronous (inline SVG) and asynchronous (URL-based) rendering.
 */

export interface SvgShadowOptions {
	/** Shadow color (default: 'rgba(0,0,0,0.3)'). */
	color?: string;
	/** Shadow blur radius in pixels (default: 4). */
	blur?: number;
	/** Horizontal shadow offset in pixels (default: 0). */
	offsetX?: number;
	/** Vertical shadow offset in pixels (default: 2). */
	offsetY?: number;
}

export interface SvgRenderOptions {
	/** SVG content (inline string or URL). */
	svg: string;
	/** Target width in pixels. */
	width: number;
	/** Target height in pixels. */
	height: number;
	/** Override fill color for all SVG elements. */
	fill?: string;
	/** Override stroke color for all SVG elements. */
	stroke?: string;
	/** Override stroke width for all SVG elements. */
	strokeWidth?: number;
	/** Shadow effect options. */
	shadow?: SvgShadowOptions;
}

export interface SvgRenderResult {
	/** The rendered canvas (can be used as CanvasImageSource). */
	canvas: HTMLCanvasElement;
	/** Width in pixels (at 2x scale for retina). */
	width: number;
	/** Height in pixels (at 2x scale for retina). */
	height: number;
	/** Data URL for the rendered SVG. */
	dataUrl: string;
}

/**
 * Check if a string looks like a URL (starts with http/https or is a data URL).
 */
function isUrl(str: string): boolean {
	const trimmed = str.trim();
	return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:');
}

/**
 * Fetch SVG content from a URL.
 */
async function fetchSvg(url: string): Promise<string> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch SVG: ${response.status} ${response.statusText}`);
	}
	return response.text();
}

/**
 * Apply color overrides to SVG content.
 * @param targetSize - The target render size (to scale stroke width relative to viewBox)
 */
function applySvgOverrides(svgContent: string, fill?: string, stroke?: string, strokeWidth?: number, targetSize?: number): string {
	// Parse SVG
	const parser = new DOMParser();
	const doc = parser.parseFromString(svgContent, 'image/svg+xml');
	const svg = doc.documentElement;

	// Check for parsing errors
	const parseError = doc.querySelector('parsererror');
	if (parseError) {
		console.warn('[GTMap] SVG parse error, using original content');
		return svgContent;
	}

	// Calculate stroke scale factor based on viewBox
	let strokeScale = 1;
	if (targetSize && strokeWidth !== undefined) {
		const viewBox = svg.getAttribute('viewBox');
		if (viewBox) {
			const parts = viewBox.split(/\s+/);
			if (parts.length >= 4) {
				const viewBoxSize = Math.max(parseFloat(parts[2]), parseFloat(parts[3]));
				// Scale stroke so that strokeWidth in pixels maps to viewBox units
				strokeScale = viewBoxSize / targetSize;
			}
		}
	}

	// Apply overrides to all elements with fill/stroke
	const elements = svg.querySelectorAll('*');
	const shapeElements = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line', 'text'];
	for (const el of elements) {
		const tagName = el.tagName.toLowerCase();
		const isShape = shapeElements.includes(tagName);

		if (fill !== undefined && isShape) {
			const currentFill = el.getAttribute('fill');
			if (currentFill !== 'none') {
				el.setAttribute('fill', fill);
			}
		}
		if (stroke !== undefined && isShape) {
			// Always set stroke attribute on shape elements
			el.setAttribute('stroke', stroke);
			// Draw stroke behind fill so it appears as an outline
			el.setAttribute('paint-order', 'stroke fill');
		}
		if (strokeWidth !== undefined && isShape) {
			// Scale stroke-width to viewBox units so it appears correctly at target size
			const scaledStrokeWidth = strokeWidth * strokeScale;
			el.setAttribute('stroke-width', String(scaledStrokeWidth));
		}
	}

	// Also apply to root SVG element for CSS-styled SVGs
	if (fill !== undefined) {
		svg.style.setProperty('fill', fill, 'important');
	}
	if (stroke !== undefined) {
		svg.style.setProperty('stroke', stroke, 'important');
	}
	if (strokeWidth !== undefined) {
		svg.style.setProperty('stroke-width', String(strokeWidth), 'important');
	}

	// Serialize back to string
	const serializer = new XMLSerializer();
	return serializer.serializeToString(svg);
}

/**
 * Create an Image from SVG content.
 */
function createImageFromSvg(svgContent: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();

		// Create blob URL from SVG content
		const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(blob);

		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('Failed to load SVG as image'));
		};

		img.src = url;
	});
}

/**
 * Render SVG to a canvas and return the result.
 *
 * @param options - SVG rendering options
 * @returns Rendered SVG as canvas with dimensions and data URL
 */
export async function renderSvgToCanvas(options: SvgRenderOptions): Promise<SvgRenderResult> {
	const { svg, width, height, fill, stroke, strokeWidth, shadow } = options;

	// Get SVG content
	let svgContent: string;
	if (isUrl(svg)) {
		svgContent = await fetchSvg(svg);
	} else {
		svgContent = svg;
	}

	// Apply color overrides (pass target size for stroke scaling)
	if (fill !== undefined || stroke !== undefined || strokeWidth !== undefined) {
		const targetSize = Math.max(width, height);
		svgContent = applySvgOverrides(svgContent, fill, stroke, strokeWidth, targetSize);
	}

	// Load SVG as image
	const img = await createImageFromSvg(svgContent);

	// Create canvas at 2x scale for retina sharpness
	const scale = 2;

	// Account for shadow in canvas size
	const shadowBlur = shadow?.blur ?? 0;
	const shadowOffsetX = shadow?.offsetX ?? 0;
	const shadowOffsetY = shadow?.offsetY ?? 0;
	const extraWidth = shadowBlur * 2 + Math.abs(shadowOffsetX);
	const extraHeight = shadowBlur * 2 + Math.abs(shadowOffsetY);

	const canvasWidth = (width + extraWidth) * scale;
	const canvasHeight = (height + extraHeight) * scale;

	const canvas = document.createElement('canvas');
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;

	const ctx = canvas.getContext('2d')!;
	ctx.scale(scale, scale);

	// Apply shadow if specified
	// Note: shadow properties are not affected by ctx.scale(), so we scale them manually
	if (shadow) {
		ctx.shadowColor = shadow.color ?? 'rgba(0,0,0,0.3)';
		ctx.shadowBlur = (shadow.blur ?? 4) * scale;
		ctx.shadowOffsetX = (shadow.offsetX ?? 0) * scale;
		ctx.shadowOffsetY = (shadow.offsetY ?? 2) * scale;
	}

	// Draw SVG image centered (accounting for shadow expansion)
	const drawX = shadowBlur + (shadowOffsetX < 0 ? -shadowOffsetX : 0);
	const drawY = shadowBlur + (shadowOffsetY < 0 ? -shadowOffsetY : 0);
	ctx.drawImage(img, drawX, drawY, width, height);

	return {
		canvas,
		width: canvasWidth,
		height: canvasHeight,
		dataUrl: canvas.toDataURL('image/png'),
	};
}

/**
 * Create an ImageBitmap from SVG (async version for better performance).
 */
export async function renderSvgToImageBitmap(options: SvgRenderOptions): Promise<{
	bitmap: ImageBitmap;
	width: number;
	height: number;
}> {
	const result = await renderSvgToCanvas(options);
	const bitmap = await createImageBitmap(result.canvas);
	return {
		bitmap,
		width: result.width,
		height: result.height,
	};
}

/**
 * Synchronously render inline SVG to a data URL (without shadow).
 * For SVG with shadows, use renderSvgToCanvas which is async.
 *
 * @param options - SVG rendering options (shadow is ignored)
 * @returns Data URL for the SVG, or null if SVG is a URL
 */
export function renderSvgToDataUrlSync(options: Omit<SvgRenderOptions, 'shadow'>): string | null {
	const { svg, width, height, fill, stroke, strokeWidth } = options;

	// Can't handle URLs synchronously
	if (isUrl(svg)) {
		return null;
	}

	// Apply color overrides if needed (pass target size for stroke scaling)
	let svgContent = svg;
	if (fill !== undefined || stroke !== undefined || strokeWidth !== undefined) {
		const targetSize = Math.max(width, height);
		svgContent = applySvgOverrides(svg, fill, stroke, strokeWidth, targetSize);
	}

	// Convert to data URL
	const encoded = encodeURIComponent(svgContent);
	return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

/**
 * Render SVG to canvas synchronously (blocks until image loads).
 * Uses a hidden Image element and polls for completion.
 * This should only be used when async rendering is not possible.
 *
 * @param options - SVG rendering options
 * @param onComplete - Callback when rendering is complete
 */
export function renderSvgToCanvasAsync(
	options: SvgRenderOptions,
	onComplete: (result: SvgRenderResult) => void,
): void {
	renderSvgToCanvas(options)
		.then(onComplete)
		.catch((err) => {
			console.warn('[GTMap] SVG render error:', err);
		});
}
