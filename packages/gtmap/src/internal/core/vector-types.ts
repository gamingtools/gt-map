/**
 * Vector type symbols for optimal performance
 * Using symbols instead of string comparisons for better performance and type safety
 */

// Create unique symbols for vector types
export const VECTOR_POLYLINE = Symbol('polyline');
export const VECTOR_POLYGON = Symbol('polygon');
export const VECTOR_CIRCLE = Symbol('circle');

// Type mapping for runtime checks
export const VECTOR_TYPE_MAP = {
	polyline: VECTOR_POLYLINE,
	polygon: VECTOR_POLYGON,
	circle: VECTOR_CIRCLE,
} as const;

// Reverse mapping for debugging/serialization
export const SYMBOL_TO_STRING_MAP = new Map([
	[VECTOR_POLYLINE, 'polyline'],
	[VECTOR_POLYGON, 'polygon'],
	[VECTOR_CIRCLE, 'circle'],
]);

export type VectorTypeSymbol = typeof VECTOR_POLYLINE | typeof VECTOR_POLYGON | typeof VECTOR_CIRCLE;

/**
 * Convert string type to symbol for internal processing
 */
export function getVectorTypeSymbol(type: string): VectorTypeSymbol | undefined {
	return VECTOR_TYPE_MAP[type as keyof typeof VECTOR_TYPE_MAP];
}

/**
 * Type guards using symbols for better performance
 */
export function isPolylineSymbol(symbol: VectorTypeSymbol): boolean {
	return symbol === VECTOR_POLYLINE;
}

export function isPolygonSymbol(symbol: VectorTypeSymbol): boolean {
	return symbol === VECTOR_POLYGON;
}

export function isCircleSymbol(symbol: VectorTypeSymbol): boolean {
	return symbol === VECTOR_CIRCLE;
}
