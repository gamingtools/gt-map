// Minimal Bounds types for Leaflet 2.0-like API (pixel CRS)
import type { Point } from './Point';

// LatLng in our pixel CRS is [lat, lng] or object elsewhere; Bounds commonly use tuples
export type LatLngTuple = [number, number];

// Tuple bounds: [[south, west], [north, east]] in pixel CRS
export type Bounds = [LatLngTuple, LatLngTuple];

export type PixelBounds = { min: Point; max: Point };

