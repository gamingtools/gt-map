/**
 * Visual types and classes for GTMap.
 *
 * @remarks
 * Visuals are pure rendering templates that define how something looks.
 * They are separate from entities (Marker) which define position and interactivity.
 */

import type { IconScaleFunction } from './types';
import { SpriteAtlasHandle } from './types';

/**
 * Discriminator for Visual subclasses.
 * @public
 */
export type VisualType = 'image' | 'text' | 'circle' | 'rect' | 'svg' | 'html' | 'sprite';

/**
 * Anchor presets for positioning visuals relative to their point.
 * @public
 */
export type AnchorPreset = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

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
export type VisualSize = number | { width: number; height: number };

/**
 * Resolve a size spec to width and height.
 * @internal
 */
export function resolveSize(size: VisualSize): { width: number; height: number } {
	return typeof size === 'number' ? { width: size, height: size } : size;
}

/**
 * Abstract base class for all visuals.
 *
 * @public
 * @remarks
 * Visuals define appearance only. Use with Marker for screen-sized interactive entities.
 */
export abstract class Visual {
	/** Discriminator for runtime type checking. */
	abstract readonly type: VisualType;

	/** Anchor point for positioning. Defaults to center. */
	anchor: Anchor = 'center';

	/**
	 * Optional scale function for this visual.
	 * Overrides the map-level iconScaleFunction when set.
	 * Set to `null` to disable scaling (use scale=1 always).
	 */
	iconScaleFunction?: IconScaleFunction | null;

	/** Stroke/outline color applied around the visual. */
	stroke?: string;

	/** Stroke/outline width in pixels. */
	strokeWidth?: number;

	/** Drop shadow effect. */
	shadow?: Shadow;

	/**
	 * Get the resolved anchor as normalized coordinates.
	 * @internal
	 */
	getAnchorPoint(): AnchorPoint {
		return resolveAnchor(this.anchor);
	}

	/** @internal Whether this visual has base-class effects that need post-processing. */
	hasEffects(): boolean {
		return (this.stroke !== undefined && this.strokeWidth !== undefined && this.strokeWidth > 0) || this.shadow !== undefined;
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
	 * @param size - Display size (number for square, or {width, height})
	 * @param icon2x - Optional 2x retina icon URL
	 */
	constructor(icon: string, size: VisualSize, icon2x?: string) {
		super();
		this.icon = icon;
		this.size = size;
		if (icon2x !== undefined) this.icon2x = icon2x;
	}

	/** Get resolved size as {width, height}. */
	getSize(): { width: number; height: number } {
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

	/** Text stroke/outline color. */
	readonly strokeColor?: string;

	/** Font weight (normal, bold, 100-900). */
	readonly fontWeight?: string;

	/** Font style (normal, italic, oblique). */
	readonly fontStyle?: string;

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
			/** Text stroke/outline color */
			strokeColor?: string;
			/** Text stroke/outline width in pixels */
			strokeWidth?: number;
			/** Font weight (normal, bold, 100-900) */
			fontWeight?: string;
			/** Font style (normal, italic, oblique) */
			fontStyle?: string;
		} = {},
	) {
		super();
		this.text = text;
		this.fontSize = options.fontSize ?? 14;
		this.fontFamily = options.fontFamily ?? 'system-ui, sans-serif';
		this.color = options.color ?? '#000000';
		if (options.backgroundColor !== undefined) this.backgroundColor = options.backgroundColor;
		if (options.padding !== undefined) this.padding = options.padding;
		if (options.strokeColor !== undefined) this.strokeColor = options.strokeColor;
		if (options.strokeWidth !== undefined) this.strokeWidth = options.strokeWidth;
		if (options.fontWeight !== undefined) this.fontWeight = options.fontWeight;
		if (options.fontStyle !== undefined) this.fontStyle = options.fontStyle;
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
		} = {},
	) {
		super();
		this.radius = radius;
		if (options.fill !== undefined) this.fill = options.fill;
		if (options.stroke !== undefined) this.stroke = options.stroke;
		if (options.strokeWidth !== undefined) this.strokeWidth = options.strokeWidth;
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
 * const box = new RectVisual({ width: 20, height: 16 }, { fill: '#0000ff', stroke: '#000' });
 * ```
 */
export class RectVisual extends Visual {
	readonly type = 'rect' as const;

	/** Rectangle size. */
	readonly size: VisualSize;

	/** Fill color. */
	readonly fill?: string;

	/** Corner radius for rounded rectangles. */
	readonly borderRadius?: number;

	/**
	 * Create a rectangle visual.
	 * @param size - Rectangle size (number for square, or {width, height})
	 * @param options - Styling options
	 */
	constructor(
		size: VisualSize,
		options: {
			fill?: string;
			stroke?: string;
			strokeWidth?: number;
			borderRadius?: number;
		} = {},
	) {
		super();
		this.size = size;
		if (options.fill !== undefined) this.fill = options.fill;
		if (options.stroke !== undefined) this.stroke = options.stroke;
		if (options.strokeWidth !== undefined) this.strokeWidth = options.strokeWidth;
		if (options.borderRadius !== undefined) this.borderRadius = options.borderRadius;
	}

	/** Get resolved size as {width, height}. */
	getSize(): { width: number; height: number } {
		return resolveSize(this.size);
	}
}

/** Shadow options for visuals. */
export interface Shadow {
	/** Shadow color (default: 'rgba(0,0,0,0.3)'). */
	color?: string;
	/** Shadow blur radius in pixels (default: 4). */
	blur?: number;
	/** Horizontal shadow offset in pixels (default: 0). */
	offsetX?: number;
	/** Vertical shadow offset in pixels (default: 2). */
	offsetY?: number;
}

/** @deprecated Use {@link Shadow} instead. */
export type SvgShadow = Shadow;

/**
 * SVG-based visual with color customization and shadow support.
 *
 * @public
 * @remarks
 * Supports inline SVG content or URLs. Colors can be overridden dynamically.
 *
 * @example
 * ```ts
 * // Basic SVG
 * const icon = new SvgVisual('<svg>...</svg>', { width: 24, height: 24 });
 *
 * // With color override and shadow
 * const colored = new SvgVisual('<svg>...</svg>', { width: 32, height: 32 }, {
 *   fill: '#ff0000',
 *   stroke: '#000000',
 *   shadow: { blur: 4, offsetY: 2 }
 * });
 * ```
 */
export class SvgVisual extends Visual {
	readonly type = 'svg' as const;

	/** SVG content (inline string or URL). */
	readonly svg: string;

	/** Display size. */
	readonly size: VisualSize;

	/** Override fill color for all SVG elements. */
	readonly fill?: string;

	/**
	 * Create an SVG visual.
	 * @param svg - SVG content string or URL
	 * @param size - Display size
	 * @param options - Color and shadow options
	 */
	constructor(
		svg: string,
		size: VisualSize,
		options: {
			/** Override fill color for all SVG elements */
			fill?: string;
			/** Override stroke color for all SVG elements */
			stroke?: string;
			/** Override stroke width for all SVG elements */
			strokeWidth?: number;
			/** Shadow effect options */
			shadow?: SvgShadow;
		} = {},
	) {
		super();
		this.svg = svg;
		this.size = size;
		if (options.fill !== undefined) this.fill = options.fill;
		if (options.stroke !== undefined) this.stroke = options.stroke;
		if (options.strokeWidth !== undefined) this.strokeWidth = options.strokeWidth;
		if (options.shadow !== undefined) this.shadow = options.shadow;
	}

	/** Get resolved size as {width, height}. */
	getSize(): { width: number; height: number } {
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
 * const html = new HtmlVisual('<div class="tooltip">Info</div>', { width: 100, height: 50 });
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

	/** Get resolved size as {width, height}. */
	getSize(): { width: number; height: number } {
		return resolveSize(this.size);
	}
}

/**
 * Sprite-based visual referencing a sub-region of a loaded sprite atlas.
 *
 * @public
 * @remarks
 * Use after calling `map.content.addSpriteAtlas()` to get a `SpriteAtlasHandle`.
 *
 * @example
 * ```ts
 * const atlas = await map.content.addSpriteAtlas(url, descriptor);
 * const sprite = new SpriteVisual(atlas, 'sword', 32);
 * map.content.addMarker(100, 200, { visual: sprite });
 * ```
 */
export class SpriteVisual extends Visual {
	readonly type = 'sprite' as const;

	/** Handle to the loaded sprite atlas. */
	readonly atlasHandle: SpriteAtlasHandle;

	/** Name of the sprite within the atlas. */
	readonly spriteName: string;

	/** Optional display size override. */
	readonly size?: VisualSize;

	/**
	 * Create a sprite visual.
	 * @param atlasHandle - Handle returned from addSpriteAtlas
	 * @param spriteName - Name of the sprite in the atlas descriptor
	 * @param size - Optional display size override (number for square, or {width, height})
	 */
	constructor(atlasHandle: SpriteAtlasHandle, spriteName: string, size?: VisualSize) {
		super();
		this.atlasHandle = atlasHandle;
		this.spriteName = spriteName;
		if (size !== undefined) this.size = size;
	}

	/** Get the icon ID for this sprite (atlasId/spriteName). */
	getIconId(): string {
		return `${this.atlasHandle.atlasId}/${this.spriteName}`;
	}

	/** Get resolved size as {width, height} if size is specified. */
	getSize(): { width: number; height: number } | undefined {
		return this.size !== undefined ? resolveSize(this.size) : undefined;
	}
}

/**
 * Type guard for SpriteVisual.
 * @public
 */
export function isSpriteVisual(v: Visual): v is SpriteVisual {
	return v.type === 'sprite';
}

// -- SpriteAtlasHandle.getVisual() --
// Defined here (not in types.ts) to avoid circular dependency with SpriteVisual.

export interface SpriteAtlasHandleVisualOptions {
	/** Uniform scale factor applied to the atlas entry's native size. */
	scale?: number;
	/** Anchor preset (defaults to 'center'). */
	anchor?: Anchor;
	/** Stroke/outline color. */
	stroke?: string;
	/** Stroke/outline width in pixels. */
	strokeWidth?: number;
	/** Drop shadow effect. */
	shadow?: Shadow;
}

declare module './types' {
	interface SpriteAtlasHandle {
		/**
		 * Create a SpriteVisual for a named sprite in this atlas.
		 * @param name - Sprite name from the atlas descriptor
		 * @param opts - Optional scale, anchor, stroke, and shadow
		 */
		getVisual(name: string, opts?: SpriteAtlasHandleVisualOptions): SpriteVisual;
	}
}

SpriteAtlasHandle.prototype.getVisual = function (this: SpriteAtlasHandle, name: string, opts?: SpriteAtlasHandleVisualOptions): SpriteVisual {
	const entry = this.descriptor.sprites[name];
	if (!entry) throw new Error(`Sprite '${name}' not found in atlas '${this.atlasId}'`);
	const scale = opts?.scale ?? 1;
	const visual = new SpriteVisual(this, name, { width: entry.width * scale, height: entry.height * scale });
	const defaultAnchor = { x: (entry.anchorX ?? entry.width / 2) / entry.width, y: (entry.anchorY ?? entry.height / 2) / entry.height };
	visual.anchor = opts?.anchor ?? defaultAnchor;
	if (opts?.stroke) visual.stroke = opts.stroke;
	if (opts?.strokeWidth) visual.strokeWidth = opts.strokeWidth;
	if (opts?.shadow) visual.shadow = opts.shadow;
	return visual;
};

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
