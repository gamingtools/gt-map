// Bounds utilities using per-instance tile size

export function clampCenterWorld(
	centerWorld: { x: number; y: number },
	zInt: number,
	scale: number,
	widthCSS: number,
	heightCSS: number,
	_wrapX: boolean,
	_freePan: boolean,
	_tileSize: number,
	_mapSize?: { width: number; height: number },
	zMax?: number,
	// Optional Leaflet-like bounds clamp (in image pixels at native resolution)
	maxBoundsPx?: { minX: number; minY: number; maxX: number; maxY: number } | null,
	maxBoundsViscosity?: number,
	viscous?: boolean,
) {
	// If explicit bounds are provided, apply them (Leaflet-like maxBounds behavior)
	if (maxBoundsPx) {
		const visc = Math.max(0, Math.min(1, maxBoundsViscosity ?? 0));
		const s = Math.pow(2, (zMax ?? zInt) - zInt);
		const minXw = maxBoundsPx.minX / s;
		const minYw = maxBoundsPx.minY / s;
		const maxXw = maxBoundsPx.maxX / s;
		const maxYw = maxBoundsPx.maxY / s;
		const halfW = widthCSS / (2 * scale);
		const halfH = heightCSS / (2 * scale);
		const minCx = minXw + halfW;
		const maxCx = maxXw - halfW;
		const minCy = minYw + halfH;
		const maxCy = maxYw - halfH;
		let cx = centerWorld.x;
		let cy = centerWorld.y;
		// If viewport exceeds bounds, pin to bounds center (Leaflet behavior)
		if (minCx > maxCx) cx = (minXw + maxXw) * 0.5;
		else {
			const clampedX = Math.max(minCx, Math.min(maxCx, cx));
			if (viscous && visc > 0) cx = cx * (1 - visc) + clampedX * visc;
			else cx = clampedX;
		}
		if (minCy > maxCy) cy = (minYw + maxYw) * 0.5;
		else {
			const clampedY = Math.max(minCy, Math.min(maxCy, cy));
			if (viscous && visc > 0) cy = cy * (1 - visc) + clampedY * visc;
			else cy = clampedY;
		}
		return { x: cx, y: cy };
	}
	// Leaflet semantics: if no explicit maxBounds are set, do not clamp the view
	// (panning can go beyond the image/world unless application sets bounds).
	return centerWorld;
}
