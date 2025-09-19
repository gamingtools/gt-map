// Coordinate helpers for fixed internal world space (native pixels at imageMaxZ)
// World space: origin top-left, x→right (lng), y→down (lat)

export type XY = { x: number; y: number };

export function zIntOf(z: number): number {
	return Math.floor(z);
}

export function sFor(imageMaxZ: number, zInt: number): number {
	return Math.pow(2, imageMaxZ - zInt);
}

export function scaleFor(z: number): number {
	return Math.pow(2, z - Math.floor(z));
}

export function zParts(z: number): { zInt: number; scale: number } {
	const zInt = Math.floor(z);
	const scale = Math.pow(2, z - zInt);
	return { zInt, scale };
}

// Effective fractional scale when rendering level `level` at zoom `z`.
export function scaleAtLevel(z: number, level: number): number {
	return Math.pow(2, z - level);
}

export function worldToLevel(world: XY, imageMaxZ: number, zInt: number): XY {
	const s = sFor(imageMaxZ, zInt);
	return { x: world.x / s, y: world.y / s };
}

export function levelToWorld(level: XY, imageMaxZ: number, zInt: number): XY {
	const s = sFor(imageMaxZ, zInt);
	return { x: level.x * s, y: level.y * s };
}

export function levelSize(mapW: number, mapH: number, imageMaxZ: number, zInt: number): XY {
	const s = sFor(imageMaxZ, zInt);
	return { x: mapW / s, y: mapH / s };
}

export function tlWorldFor(centerWorld: XY, z: number, viewportCSS: XY, imageMaxZ: number): XY {
	const zInt = zIntOf(z);
	const scale = scaleFor(z);
	const levelCenter = worldToLevel(centerWorld, imageMaxZ, zInt);
	return { x: levelCenter.x - viewportCSS.x / (2 * scale), y: levelCenter.y - viewportCSS.y / (2 * scale) };
}

// Variant operating purely in level space (avoids roundtrip through world)
export function tlLevelFor(centerLevel: XY, z: number, viewportCSS: XY): XY {
	const { scale } = zParts(z);
	return { x: centerLevel.x - viewportCSS.x / (2 * scale), y: centerLevel.y - viewportCSS.y / (2 * scale) };
}

// Compute TL in level space when the effective scale is supplied explicitly.
export function tlLevelForWithScale(centerLevel: XY, scale: number, viewportCSS: XY): XY {
	return { x: centerLevel.x - viewportCSS.x / (2 * scale), y: centerLevel.y - viewportCSS.y / (2 * scale) };
}

export function worldToCSS(world: XY, z: number, centerWorld: XY, viewportCSS: XY, imageMaxZ: number): XY {
	const zInt = zIntOf(z);
	const scale = scaleFor(z);
	const tl = tlWorldFor(centerWorld, z, viewportCSS, imageMaxZ);
	const lvl = worldToLevel(world, imageMaxZ, zInt);
	return { x: (lvl.x - tl.x) * scale, y: (lvl.y - tl.y) * scale };
}

export function cssToWorld(css: XY, z: number, centerWorld: XY, viewportCSS: XY, imageMaxZ: number): XY {
	const zInt = zIntOf(z);
	const scale = scaleFor(z);
	const tl = tlWorldFor(centerWorld, z, viewportCSS, imageMaxZ);
	const lvl = { x: css.x / scale + tl.x, y: css.y / scale + tl.y };
	return levelToWorld(lvl, imageMaxZ, zInt);
}

export function worldToLevelCenter(centerWorld: XY, imageMaxZ: number, zInt: number): XY {
	return worldToLevel(centerWorld, imageMaxZ, zInt);
}

export function cssToLevel(css: XY, z: number, tlLevel: XY): XY {
	const { scale } = zParts(z);
	return { x: css.x / scale + tlLevel.x, y: css.y / scale + tlLevel.y };
}

export function levelToCSS(level: XY, z: number, tlLevel: XY): XY {
	const { scale } = zParts(z);
	return { x: (level.x - tlLevel.x) * scale, y: (level.y - tlLevel.y) * scale };
}

export function snapLevelToDevice(levelCoord: number, scale: number, dpr: number): number {
	return Math.round(levelCoord * scale * dpr) / (scale * dpr);
}

// Relative scale factor between two integer zoom levels (level space)
export function levelFactor(fromZInt: number, toZInt: number): number {
	return Math.pow(2, fromZInt - toZInt);
}
