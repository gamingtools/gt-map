/**
 * Text-to-texture renderer for TextVisual support.
 *
 * Renders text to an offscreen canvas and returns the image data
 * for use as a marker icon texture.
 */

export interface TextRenderOptions {
	text: string;
	fontSize: number;
	fontFamily: string;
	color: string;
	backgroundColor?: string;
	padding?: number;
	/** Maximum width before text wrapping (0 = no limit) */
	maxWidth?: number;
	/** Font weight (normal, bold, 100-900) */
	fontWeight?: string;
	/** Font style (normal, italic, oblique) */
	fontStyle?: string;
	/** Border/outline color (around background box) */
	borderColor?: string;
	/** Border width in pixels (around background box) */
	borderWidth?: number;
	/** Border radius for rounded corners */
	borderRadius?: number;
	/** Text stroke/outline color */
	strokeColor?: string;
	/** Text stroke/outline width in pixels */
	strokeWidth?: number;
}

export interface TextRenderResult {
	/** The rendered canvas (can be used as CanvasImageSource) */
	canvas: HTMLCanvasElement;
	/** Width in pixels */
	width: number;
	/** Height in pixels */
	height: number;
	/** Data URL for the rendered text */
	dataUrl: string;
}

/**
 * Render text to a canvas and return the result.
 *
 * @param options - Text rendering options
 * @returns Rendered text as canvas with dimensions and data URL
 */
export function renderTextToCanvas(options: TextRenderOptions): TextRenderResult {
	const {
		text,
		fontSize,
		fontFamily,
		color,
		backgroundColor,
		padding = 4,
		maxWidth = 0,
		fontWeight = 'normal',
		fontStyle = 'normal',
		borderColor,
		borderWidth = 0,
		borderRadius = 0,
		strokeColor,
		strokeWidth = 0,
	} = options;

	// Create measurement canvas
	const measureCanvas = document.createElement('canvas');
	const measureCtx = measureCanvas.getContext('2d')!;

	// Set font for measurement (CSS font shorthand: style weight size family)
	const font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
	measureCtx.font = font;

	// Split text into lines if maxWidth is set
	const lines = maxWidth > 0 ? wrapText(measureCtx, text, maxWidth - padding * 2) : [text];

	// Measure text dimensions using actual font metrics
	let maxLineWidth = 0;
	let maxAscent = 0;
	let maxDescent = 0;
	for (const line of lines) {
		const metrics = measureCtx.measureText(line);
		maxLineWidth = Math.max(maxLineWidth, metrics.width);
		// Use actual bounding box metrics for accurate height
		if (metrics.actualBoundingBoxAscent !== undefined && metrics.actualBoundingBoxAscent > 0) {
			maxAscent = Math.max(maxAscent, metrics.actualBoundingBoxAscent);
			maxDescent = Math.max(maxDescent, metrics.actualBoundingBoxDescent || 0);
		}
	}

	// Fall back to fontSize estimate if metrics not available
	const hasMetrics = maxAscent > 0;
	if (!hasMetrics) {
		maxAscent = fontSize * 0.8; // Approximate ascent
		maxDescent = fontSize * 0.2; // Approximate descent
	}
	const actualLineHeight = maxAscent + maxDescent;
	const lineSpacing = fontSize * 0.25; // Spacing between lines for multi-line
	const textHeight = lines.length * actualLineHeight + Math.max(0, lines.length - 1) * lineSpacing;

	// Calculate canvas size with padding, border, and text stroke
	const textStrokeExtra = strokeWidth; // Stroke extends outward
	const totalPadding = padding * 2 + borderWidth * 2 + textStrokeExtra * 2;
	const width = Math.ceil(maxLineWidth + totalPadding);
	const height = Math.ceil(textHeight + totalPadding);

	// Create final canvas
	const canvas = document.createElement('canvas');
	// Use 2x resolution for sharper text on retina displays
	const scale = 2;
	canvas.width = width * scale;
	canvas.height = height * scale;

	const ctx = canvas.getContext('2d')!;
	ctx.scale(scale, scale);

	// Draw background if specified
	if (backgroundColor || borderColor) {
		ctx.beginPath();
		if (borderRadius > 0) {
			roundRect(ctx, borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth, borderRadius);
		} else {
			ctx.rect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
		}

		if (backgroundColor) {
			ctx.fillStyle = backgroundColor;
			ctx.fill();
		}

		if (borderColor && borderWidth > 0) {
			ctx.strokeStyle = borderColor;
			ctx.lineWidth = borderWidth;
			ctx.stroke();
		}
	}

	// Draw text
	ctx.font = font;
	ctx.textBaseline = 'alphabetic';
	ctx.textAlign = 'left';

	const textX = padding + borderWidth + strokeWidth;
	// Start at padding + ascent so text baseline aligns properly
	const startY = padding + borderWidth + strokeWidth + maxAscent;
	let textY = startY;

	for (const line of lines) {
		// Draw stroke first (behind fill)
		if (strokeColor && strokeWidth > 0) {
			ctx.strokeStyle = strokeColor;
			ctx.lineWidth = strokeWidth * 2; // Stroke is centered, so double for full width
			ctx.lineJoin = 'round';
			ctx.strokeText(line, textX, textY);
		}
		// Draw fill
		ctx.fillStyle = color;
		ctx.fillText(line, textX, textY);
		textY += actualLineHeight + lineSpacing;
	}

	return {
		canvas,
		width: width * scale,
		height: height * scale,
		dataUrl: canvas.toDataURL('image/png'),
	};
}

/**
 * Wrap text to fit within a maximum width.
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
	const words = text.split(' ');
	const lines: string[] = [];
	let currentLine = '';

	for (const word of words) {
		const testLine = currentLine ? `${currentLine} ${word}` : word;
		const metrics = ctx.measureText(testLine);

		if (metrics.width > maxWidth && currentLine) {
			lines.push(currentLine);
			currentLine = word;
		} else {
			currentLine = testLine;
		}
	}

	if (currentLine) {
		lines.push(currentLine);
	}

	return lines.length > 0 ? lines : [''];
}

/**
 * Draw a rounded rectangle path.
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
	const r = Math.min(radius, width / 2, height / 2);
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + width - r, y);
	ctx.arcTo(x + width, y, x + width, y + r, r);
	ctx.lineTo(x + width, y + height - r);
	ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
	ctx.lineTo(x + r, y + height);
	ctx.arcTo(x, y + height, x, y + height - r, r);
	ctx.lineTo(x, y + r);
	ctx.arcTo(x, y, x + r, y, r);
	ctx.closePath();
}

