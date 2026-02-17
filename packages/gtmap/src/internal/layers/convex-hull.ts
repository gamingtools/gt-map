/**
 * Convex hull computation via Graham scan.
 *
 * Returns the convex hull of a set of 2D points as an array of points
 * in counter-clockwise order. For fewer than 3 points, returns a copy
 * of the input.
 */

interface Pt {
	x: number;
	y: number;
}

function cross(o: Pt, a: Pt, b: Pt): number {
	return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

export function convexHull(points: readonly Pt[]): Pt[] {
	const n = points.length;
	if (n < 3) return points.map((p) => ({ x: p.x, y: p.y }));

	// Sort by x, then by y
	const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);

	// Build lower hull
	const lower: Pt[] = [];
	for (let i = 0; i < n; i++) {
		while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, sorted[i]!) <= 0) {
			lower.pop();
		}
		lower.push(sorted[i]!);
	}

	// Build upper hull
	const upper: Pt[] = [];
	for (let i = n - 1; i >= 0; i--) {
		while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, sorted[i]!) <= 0) {
			upper.pop();
		}
		upper.push(sorted[i]!);
	}

	// Remove last point of each half because it's repeated
	lower.pop();
	upper.pop();

	return lower.concat(upper);
}
