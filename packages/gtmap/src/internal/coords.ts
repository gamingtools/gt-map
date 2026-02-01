/**
 * Coordinate transformation utilities for the pixel-based map renderer.
 *
 * ## Coordinate Spaces
 *
 * The renderer uses three coordinate spaces:
 *
 * ### 1. World Space (native pixels)
 * - Origin: top-left corner of the full image
 * - Units: pixels at the image's native resolution
 * - Range: (0,0) to (imageWidth, imageHeight)
 * - Used for: marker positions, bounds, user-facing coordinates
 *
 * ### 2. Level Space (tile-aligned coordinates)
 * - Origin: top-left corner at a specific integer zoom level
 * - Units: pixels at that zoom level (scaled from world space)
 * - Conversion: levelCoord = worldCoord / 2^(imageMaxZ - zInt)
 * - Used for: internal rendering calculations, tile alignment
 *
 * ### 3. CSS Space (screen coordinates)
 * - Origin: top-left of the map container
 * - Units: CSS pixels (device-independent)
 * - Used for: DOM events, hit testing, overlay positioning
 *
 * ## Zoom Model
 *
 * Zoom is a continuous value where:
 * - `zInt = floor(zoom)` is the integer zoom level
 * - `scale = 2^(zoom - zInt)` is the fractional scale (1.0 to 2.0)
 *
 * At zoom=0, the entire image fits in ~256px (base tile size).
 * At zoom=imageMaxZ, 1 world pixel = 1 CSS pixel (at scale=1).
 *
 * ## Example
 *
 * For an 8192x8192 image:
 * - imageMaxZ = log2(8192/256) = 5
 * - At zoom=5: world coords map 1:1 to level coords
 * - At zoom=3: level coords are 4x smaller (world / 4)
 * - At zoom=5.5: scale=1.41, so 1 level pixel = 1.41 CSS pixels
 */

export type XY = { x: number; y: number };

/**
 * Extract the integer zoom level from a continuous zoom value.
 * @param z - Continuous zoom (e.g., 3.7)
 * @returns Integer zoom level (e.g., 3)
 */
export function zIntOf(z: number): number {
	return Math.floor(z);
}

/**
 * Compute the world-to-level scale factor for a given integer zoom level.
 *
 * This is how many world pixels fit into one level pixel.
 * At imageMaxZ, s=1 (1:1 mapping). At lower zooms, s>1 (downscaled).
 *
 * @param imageMaxZ - The zoom level where world pixels = level pixels
 * @param zInt - The target integer zoom level
 * @returns Scale factor: worldCoord / s = levelCoord
 *
 * @example
 * // For 8192px image (imageMaxZ=5), at zoom level 3:
 * sFor(5, 3) // => 4 (world pixels are 4x larger than level pixels)
 */
export function sFor(imageMaxZ: number, zInt: number): number {
	return Math.pow(2, imageMaxZ - zInt);
}

/**
 * Compute the fractional scale from a continuous zoom value.
 *
 * This is the sub-integer zoom interpolation (1.0 to 2.0).
 * Used to smoothly scale between integer zoom levels.
 *
 * @param z - Continuous zoom value
 * @returns Fractional scale: 2^(z - floor(z)), range [1, 2)
 *
 * @example
 * scaleFor(3.0)  // => 1.0
 * scaleFor(3.5)  // => 1.414 (sqrt(2))
 * scaleFor(3.99) // => ~1.99
 */
export function scaleFor(z: number): number {
	return Math.pow(2, z - Math.floor(z));
}

/**
 * Decompose a continuous zoom into integer level and fractional scale.
 *
 * @param z - Continuous zoom value
 * @returns { zInt, scale } where zoom = zInt + log2(scale)
 */
export function zParts(z: number): { zInt: number; scale: number } {
	const zInt = Math.floor(z);
	const scale = Math.pow(2, z - zInt);
	return { zInt, scale };
}

/**
 * Decompose a continuous zoom for tile-level selection with a configurable snap threshold.
 *
 * When the fractional part of the zoom >= threshold, we snap up to the next integer zoom
 * level (and the scale becomes < 1, meaning downscale). This trades loading more tiles
 * for sharper imagery at high fractional zooms.
 *
 * @param z - Continuous zoom value
 * @param threshold - Fractional threshold in [0, 1) at which to snap up (e.g. 0.4)
 * @returns { zInt, scale } decomposition biased toward the sharper tile level
 *
 * @example
 * tileZParts(3.3, 0.4) // => { zInt: 3, scale: 1.23 }  (below threshold, same as floor)
 * tileZParts(3.4, 0.4) // => { zInt: 4, scale: 0.66 }  (at threshold, snap up)
 * tileZParts(3.8, 0.4) // => { zInt: 4, scale: 0.87 }  (above threshold, snap up)
 */
export function tileZParts(z: number, threshold: number): { zInt: number; scale: number } {
	const floor = Math.floor(z);
	const frac = z - floor;
	const zInt = frac >= threshold ? floor + 1 : floor;
	const scale = Math.pow(2, z - zInt);
	return { zInt, scale };
}

/**
 * Compute the effective scale when rendering a specific level at zoom z.
 *
 * @param z - Current continuous zoom
 * @param level - The tile/level being rendered
 * @returns Scale factor for rendering that level
 */
export function scaleAtLevel(z: number, level: number): number {
	return Math.pow(2, z - level);
}

/**
 * Convert world coordinates to level coordinates.
 *
 * Level coords are smaller at lower zoom levels (more world fits in less space).
 *
 * @param world - Position in world space (native pixels)
 * @param imageMaxZ - Zoom level where world = level (1:1)
 * @param zInt - Target integer zoom level
 * @returns Position in level space
 *
 * @example
 * // 8192px image, convert world (4096, 4096) to level coords at zoom 3
 * worldToLevel({ x: 4096, y: 4096 }, 5, 3)
 * // => { x: 1024, y: 1024 } (divided by 4)
 */
export function worldToLevel(world: XY, imageMaxZ: number, zInt: number): XY {
	const s = sFor(imageMaxZ, zInt);
	return { x: world.x / s, y: world.y / s };
}

/**
 * Convert level coordinates back to world coordinates.
 *
 * @param level - Position in level space
 * @param imageMaxZ - Zoom level where world = level (1:1)
 * @param zInt - The integer zoom level of the input
 * @returns Position in world space (native pixels)
 */
export function levelToWorld(level: XY, imageMaxZ: number, zInt: number): XY {
	const s = sFor(imageMaxZ, zInt);
	return { x: level.x * s, y: level.y * s };
}

/**
 * Compute the size of the map in level coordinates at a given zoom.
 *
 * @param mapW - Map width in world pixels
 * @param mapH - Map height in world pixels
 * @param imageMaxZ - Zoom level where world = level
 * @param zInt - Target integer zoom level
 * @returns Map dimensions in level space
 */
export function levelSize(mapW: number, mapH: number, imageMaxZ: number, zInt: number): XY {
	const s = sFor(imageMaxZ, zInt);
	return { x: mapW / s, y: mapH / s };
}

/**
 * Compute the top-left corner of the viewport in level coordinates.
 *
 * Given the center of the view in world space, this calculates where
 * the viewport's top-left corner falls in level space.
 *
 * @param centerWorld - View center in world coordinates
 * @param z - Current continuous zoom
 * @param viewportCSS - Viewport dimensions in CSS pixels
 * @param imageMaxZ - Zoom level where world = level
 * @returns Top-left corner in level space
 *
 * @remarks
 * The viewport half-size in level space is (viewportCSS / 2) / scale.
 * We subtract this from the center to get the top-left.
 */
export function tlWorldFor(centerWorld: XY, z: number, viewportCSS: XY, imageMaxZ: number): XY {
	const zInt = zIntOf(z);
	const scale = scaleFor(z);
	const levelCenter = worldToLevel(centerWorld, imageMaxZ, zInt);
	return { x: levelCenter.x - viewportCSS.x / (2 * scale), y: levelCenter.y - viewportCSS.y / (2 * scale) };
}

/**
 * Compute viewport top-left directly in level space (avoids world conversion).
 *
 * @param centerLevel - View center already in level coordinates
 * @param z - Current continuous zoom
 * @param viewportCSS - Viewport dimensions in CSS pixels
 * @returns Top-left corner in level space
 */
export function tlLevelFor(centerLevel: XY, z: number, viewportCSS: XY): XY {
	const { scale } = zParts(z);
	return { x: centerLevel.x - viewportCSS.x / (2 * scale), y: centerLevel.y - viewportCSS.y / (2 * scale) };
}

/**
 * Compute viewport top-left with explicit scale (for animation interpolation).
 *
 * @param centerLevel - View center in level coordinates
 * @param scale - Explicit fractional scale
 * @param viewportCSS - Viewport dimensions in CSS pixels
 * @returns Top-left corner in level space
 */
export function tlLevelForWithScale(centerLevel: XY, scale: number, viewportCSS: XY): XY {
	return { x: centerLevel.x - viewportCSS.x / (2 * scale), y: centerLevel.y - viewportCSS.y / (2 * scale) };
}

/**
 * Convert world coordinates to CSS screen coordinates.
 *
 * This is the main function for positioning markers and overlays on screen.
 *
 * @param world - Position in world space (native pixels)
 * @param z - Current continuous zoom
 * @param centerWorld - View center in world coordinates
 * @param viewportCSS - Viewport dimensions in CSS pixels
 * @param imageMaxZ - Zoom level where world = level
 * @returns Position in CSS pixels relative to viewport top-left
 *
 * @example
 * // Convert marker at world (4096, 4096) to screen position
 * worldToCSS({ x: 4096, y: 4096 }, 3.5, center, viewport, 5)
 * // => { x: 320, y: 240 } (depends on center/viewport)
 */
export function worldToCSS(world: XY, z: number, centerWorld: XY, viewportCSS: XY, imageMaxZ: number): XY {
	const zInt = zIntOf(z);
	const scale = scaleFor(z);
	// Get viewport top-left in level space
	const tl = tlWorldFor(centerWorld, z, viewportCSS, imageMaxZ);
	// Convert world point to level space
	const lvl = worldToLevel(world, imageMaxZ, zInt);
	// Offset from top-left, scaled to CSS pixels
	return { x: (lvl.x - tl.x) * scale, y: (lvl.y - tl.y) * scale };
}

/**
 * Convert CSS screen coordinates to world coordinates.
 *
 * This is the inverse of worldToCSS - used for hit testing and
 * converting mouse/touch positions to map coordinates.
 *
 * @param css - Position in CSS pixels relative to viewport
 * @param z - Current continuous zoom
 * @param centerWorld - View center in world coordinates
 * @param viewportCSS - Viewport dimensions in CSS pixels
 * @param imageMaxZ - Zoom level where world = level
 * @returns Position in world space (native pixels)
 *
 * @example
 * // Convert click at screen (320, 240) to world position
 * cssToWorld({ x: 320, y: 240 }, 3.5, center, viewport, 5)
 * // => { x: 4096, y: 4096 } (depends on center/viewport)
 */
export function cssToWorld(css: XY, z: number, centerWorld: XY, viewportCSS: XY, imageMaxZ: number): XY {
	const zInt = zIntOf(z);
	const scale = scaleFor(z);
	// Get viewport top-left in level space
	const tl = tlWorldFor(centerWorld, z, viewportCSS, imageMaxZ);
	// Convert CSS to level space (inverse of scale, add offset)
	const lvl = { x: css.x / scale + tl.x, y: css.y / scale + tl.y };
	// Convert level back to world
	return levelToWorld(lvl, imageMaxZ, zInt);
}

/**
 * Alias for worldToLevel with center-specific naming.
 * @deprecated Use worldToLevel directly
 */
export function worldToLevelCenter(centerWorld: XY, imageMaxZ: number, zInt: number): XY {
	return worldToLevel(centerWorld, imageMaxZ, zInt);
}

/**
 * Convert CSS coordinates to level space given a known top-left.
 *
 * Useful when the viewport TL is already computed (avoids recomputation).
 *
 * @param css - Position in CSS pixels
 * @param z - Current continuous zoom
 * @param tlLevel - Pre-computed viewport top-left in level space
 * @returns Position in level space
 */
export function cssToLevel(css: XY, z: number, tlLevel: XY): XY {
	const { scale } = zParts(z);
	return { x: css.x / scale + tlLevel.x, y: css.y / scale + tlLevel.y };
}

/**
 * Convert level coordinates to CSS given a known top-left.
 *
 * @param level - Position in level space
 * @param z - Current continuous zoom
 * @param tlLevel - Pre-computed viewport top-left in level space
 * @returns Position in CSS pixels
 */
export function levelToCSS(level: XY, z: number, tlLevel: XY): XY {
	const { scale } = zParts(z);
	return { x: (level.x - tlLevel.x) * scale, y: (level.y - tlLevel.y) * scale };
}

/**
 * Snap a level coordinate to the device pixel grid.
 *
 * Prevents sub-pixel rendering artifacts (shimmer) during pan/zoom
 * by aligning to physical device pixels.
 *
 * @param levelCoord - Coordinate in level space
 * @param scale - Current fractional scale
 * @param dpr - Device pixel ratio (window.devicePixelRatio)
 * @returns Snapped level coordinate
 *
 * @remarks
 * The snapping formula: round(coord * scale * dpr) / (scale * dpr)
 * This ensures the final CSS pixel lands on a device pixel boundary.
 */
export function snapLevelToDevice(levelCoord: number, scale: number, dpr: number): number {
	return Math.round(levelCoord * scale * dpr) / (scale * dpr);
}

/**
 * Compute the relative scale factor between two integer zoom levels.
 *
 * Used for tile LOD calculations and cross-level coordinate conversion.
 *
 * @param fromZInt - Source integer zoom level
 * @param toZInt - Target integer zoom level
 * @returns Scale factor: coords at fromZInt * factor = coords at toZInt
 *
 * @example
 * levelFactor(5, 3) // => 4 (level 5 coords are 4x larger than level 3)
 * levelFactor(3, 5) // => 0.25 (level 3 coords are 4x smaller)
 */
export function levelFactor(fromZInt: number, toZInt: number): number {
	return Math.pow(2, fromZInt - toZInt);
}
