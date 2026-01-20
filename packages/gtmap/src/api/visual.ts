/**
 * Visual types and classes for GTMap.
 *
 * @remarks
 * Visuals are pure rendering templates that define how something looks.
 * They are separate from entities (Marker, Decal) which define position and interactivity.
 */

/**
 * Discriminator for Visual subclasses.
 * @public
 */
export type VisualType = 'image' | 'text' | 'circle' | 'rect' | 'svg' | 'html';

/**
 * Anchor presets for positioning visuals relative to their point.
 * @public
 */
export type AnchorPreset =
	| 'top-left'
	| 'top-center'
	| 'top-right'
	| 'center-left'
	| 'center'
	| 'center-right'
	| 'bottom-left'
	| 'bottom-center'
	| 'bottom-right';

/**
 * Explicit anchor as normalized coordinates (0-1 range).
 * @public
 */
export interface AnchorPoint {
	/** X position from left (0 = left edge, 0.5 = center, 1 = right edge) */
	x: number;
	/** Y position from top (0 = top edge, 0.5 = center, 1 = bottom edge) */
	y: number;
}

/**
 * Anchor specification: either a preset or explicit coordinates.
 * @public
 */
export type Anchor = AnchorPreset | AnchorPoint;

/**
 * Resolve an anchor preset to normalized coordinates.
 * @internal
 */
export function resolveAnchor(anchor: Anchor): AnchorPoint {
	if (typeof anchor === 'object') return anchor;
	switch (anchor) {
		case 'top-left':
			return { x: 0, y: 0 };
		case 'top-center':
			return { x: 0.5, y: 0 };
		case 'top-right':
			return { x: 1, y: 0 };
		case 'center-left':
			return { x: 0, y: 0.5 };
		case 'center':
			return { x: 0.5, y: 0.5 };
		case 'center-right':
			return { x: 1, y: 0.5 };
		case 'bottom-left':
			return { x: 0, y: 1 };
		case 'bottom-center':
			return { x: 0.5, y: 1 };
		case 'bottom-right':
			return { x: 1, y: 1 };
	}
}

/**
 * Size specification: single number (square) or width/height object.
 * @public
 */
export type VisualSize = number | { w: number; h: number };

/**
 * Resolve a size spec to width and height.
 * @internal
 */
export function resolveSize(size: VisualSize): { w: number; h: number } {
	return typeof size === 'number' ? { w: size, h: size } : size;
}

/**
 * Abstract base class for all visuals.
 *
 * @public
 * @remarks
 * Visuals define appearance only. Use with Marker (interactive) or Decal (non-interactive).
 */
export abstract class Visual {
	/** Discriminator for runtime type checking. */
	abstract readonly type: VisualType;

	/** Anchor point for positioning. Defaults to center. */
	anchor: Anchor = 'center';

	/**
	 * Get the resolved anchor as normalized coordinates.
	 * @internal
	 */
	getAnchorPoint(): AnchorPoint {
		return resolveAnchor(this.anchor);
	}
}

/**
 * Image-based visual using a bitmap icon.
 *
 * @public
 * @example
 * ```ts
 * const icon = new ImageVisual('/icons/marker.png', 32);
 * icon.anchor = 'bottom-center';
 * ```
 */
export class ImageVisual extends Visual {
	readonly type = 'image' as const;

	/** URL or data URL for the icon bitmap. */
	readonly icon: string;

	/** Optional URL for 2x (retina) bitmap. */
	readonly icon2x?: string;

	/** Display size in pixels. */
	readonly size: VisualSize;

	/**
	 * Create an image visual.
	 * @param icon - URL or data URL for the icon
	 * @param size - Display size (number for square, or {w, h})
	 * @param icon2x - Optional 2x retina icon URL
	 */
	constructor(icon: string, size: VisualSize, icon2x?: string) {
		super();
		this.icon = icon;
		this.size = size;
		this.icon2x = icon2x;
	}

	/** Get resolved size as {w, h}. */
	getSize(): { w: number; h: number } {
		return resolveSize(this.size);
	}
}

/**
 * Text-based visual for labels.
 *
 * @public
 * @example
 * ```ts
 * const label = new TextVisual('Location Name', { fontSize: 14, color: '#fff' });
 * label.anchor = 'bottom-center';
 * ```
 */
export class TextVisual extends Visual {
	readonly type = 'text' as const;

	/** Text content to display. */
	readonly text: string;

	/** Font size in pixels. */
	readonly fontSize: number;

	/** Font family. Defaults to system sans-serif. */
	readonly fontFamily: string;

	/** Text color. Defaults to black. */
	readonly color: string;

	/** Optional background color. */
	readonly backgroundColor?: string;

	/** Optional padding in pixels. */
	readonly padding?: number;

	/**
	 * Create a text visual.
	 * @param text - Text content
	 * @param options - Styling options
	 */
	constructor(
		text: string,
		options: {
			fontSize?: number;
			fontFamily?: string;
			color?: string;
			backgroundColor?: string;
			padding?: number;
		} = {}
	) {
		super();
		this.text = text;
		this.fontSize = options.fontSize ?? 14;
		this.fontFamily = options.fontFamily ?? 'system-ui, sans-serif';
		this.color = options.color ?? '#000000';
		this.backgroundColor = options.backgroundColor;
		this.padding = options.padding;
	}
}

/**
 * Circle shape visual.
 *
 * @public
 * @remarks
 * For point-based circle markers. For absolute-coordinate circles, use Vector with circle geometry.
 *
 * @example
 * ```ts
 * const dot = new CircleVisual(8, { fill: '#ff0000' });
 * ```
 */
export class CircleVisual extends Visual {
	readonly type = 'circle' as const;

	/** Radius in pixels. */
	readonly radius: number;

	/** Fill color. */
	readonly fill?: string;

	/** Stroke color. */
	readonly stroke?: string;

	/** Stroke width in pixels. */
	readonly strokeWidth?: number;

	/**
	 * Create a circle visual.
	 * @param radius - Circle radius in pixels
	 * @param options - Styling options
	 */
	constructor(
		radius: number,
		options: {
			fill?: string;
			stroke?: string;
			strokeWidth?: number;
		} = {}
	) {
		super();
		this.radius = radius;
		this.fill = options.fill;
		this.stroke = options.stroke;
		this.strokeWidth = options.strokeWidth;
	}
}

/**
 * Rectangle shape visual.
 *
 * @public
 * @remarks
 * For point-based rectangle markers. For absolute-coordinate rectangles, use Vector with polygon geometry.
 *
 * @example
 * ```ts
 * const box = new RectVisual({ w: 20, h: 16 }, { fill: '#0000ff', stroke: '#000' });
 * ```
 */
export class RectVisual extends Visual {
	readonly type = 'rect' as const;

	/** Rectangle size. */
	readonly size: VisualSize;

	/** Fill color. */
	readonly fill?: string;

	/** Stroke color. */
	readonly stroke?: string;

	/** Stroke width in pixels. */
	readonly strokeWidth?: number;

	/** Corner radius for rounded rectangles. */
	readonly borderRadius?: number;

	/**
	 * Create a rectangle visual.
	 * @param size - Rectangle size (number for square, or {w, h})
	 * @param options - Styling options
	 */
	constructor(
		size: VisualSize,
		options: {
			fill?: string;
			stroke?: string;
			strokeWidth?: number;
			borderRadius?: number;
		} = {}
	) {
		super();
		this.size = size;
		this.fill = options.fill;
		this.stroke = options.stroke;
		this.strokeWidth = options.strokeWidth;
		this.borderRadius = options.borderRadius;
	}

	/** Get resolved size as {w, h}. */
	getSize(): { w: number; h: number } {
		return resolveSize(this.size);
	}
}

/**
 * SVG-based visual.
 *
 * @public
 * @example
 * ```ts
 * const svg = new SvgVisual('<svg>...</svg>', { w: 24, h: 24 });
 * ```
 */
export class SvgVisual extends Visual {
	readonly type = 'svg' as const;

	/** SVG content (inline string or URL). */
	readonly svg: string;

	/** Display size. */
	readonly size: VisualSize;

	/**
	 * Create an SVG visual.
	 * @param svg - SVG content string or URL
	 * @param size - Display size
	 */
	constructor(svg: string, size: VisualSize) {
		super();
		this.svg = svg;
		this.size = size;
	}

	/** Get resolved size as {w, h}. */
	getSize(): { w: number; h: number } {
		return resolveSize(this.size);
	}
}

/**
 * HTML-based visual for complex content.
 *
 * @public
 * @remarks
 * Rendered as a DOM overlay. Use sparingly for performance.
 *
 * @example
 * ```ts
 * const html = new HtmlVisual('<div class="tooltip">Info</div>', { w: 100, h: 50 });
 * ```
 */
export class HtmlVisual extends Visual {
	readonly type = 'html' as const;

	/** HTML content string. */
	readonly html: string;

	/** Display size. */
	readonly size: VisualSize;

	/**
	 * Create an HTML visual.
	 * @param html - HTML content string
	 * @param size - Display size
	 */
	constructor(html: string, size: VisualSize) {
		super();
		this.html = html;
		this.size = size;
	}

	/** Get resolved size as {w, h}. */
	getSize(): { w: number; h: number } {
		return resolveSize(this.size);
	}
}

/**
 * Type guard for ImageVisual.
 * @public
 */
export function isImageVisual(v: Visual): v is ImageVisual {
	return v.type === 'image';
}

/**
 * Type guard for TextVisual.
 * @public
 */
export function isTextVisual(v: Visual): v is TextVisual {
	return v.type === 'text';
}

/**
 * Type guard for CircleVisual.
 * @public
 */
export function isCircleVisual(v: Visual): v is CircleVisual {
	return v.type === 'circle';
}

/**
 * Type guard for RectVisual.
 * @public
 */
export function isRectVisual(v: Visual): v is RectVisual {
	return v.type === 'rect';
}

/**
 * Type guard for SvgVisual.
 * @public
 */
export function isSvgVisual(v: Visual): v is SvgVisual {
	return v.type === 'svg';
}

/**
 * Type guard for HtmlVisual.
 * @public
 */
export function isHtmlVisual(v: Visual): v is HtmlVisual {
	return v.type === 'html';
}
