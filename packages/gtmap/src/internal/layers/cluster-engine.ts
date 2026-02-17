/**
 * ClusterEngine -- hierarchical spatial clustering for markers (pixel CRS).
 *
 * Based on the Supercluster algorithm (KD-tree + hierarchical zoom pre-computation).
 * Adapted for pixel coordinate systems instead of geographic lng/lat.
 *
 * On load: builds a KD-tree index at each zoom level from maxZoom down to minZoom.
 * On query: returns pre-computed clusters for a given zoom in O(log n) time.
 */

import type { MarkerInternal } from '../../api/types';
import { convexHull } from './convex-hull';

export interface ClusterData {
	id: string;
	x: number;
	y: number;
	representativeIndex: number;
	markerIndices: number[];
	size: number;
	bounds: { x: number; y: number }[];
	/** @internal Encoded source cluster id for lazy member expansion. */
	sourceId: number;
	/** @internal Source zoom level for lazy member expansion. */
	sourceZoom: number;
}

export interface ClusterResult {
	clusters: ClusterData[];
	singlesIndices: number[];
}

// ── Inline KD-tree (minimal KDBush adaptation) ─────────────────────────

/** Minimal KD-tree for fast 2D range and radius queries. */
class KDTree {
	readonly numItems: number;
	readonly nodeSize: number;
	readonly ids: Uint32Array;
	readonly coords: Float32Array;
	/** Flat data array attached externally by the clustering algorithm. */
	data!: number[];

	constructor(numItems: number, nodeSize = 64) {
		this.numItems = numItems;
		this.nodeSize = Math.max(2, nodeSize);
		this.ids = new Uint32Array(numItems);
		this.coords = new Float32Array(numItems * 2);
	}

	private _pos = 0;

	add(x: number, y: number): number {
		const idx = this._pos >> 1;
		this.ids[idx] = idx;
		this.coords[this._pos++] = x;
		this.coords[this._pos++] = y;
		return idx;
	}

	finish(): void {
		kdSort(this.ids, this.coords, this.nodeSize, 0, this.numItems - 1, 0);
	}

	/** Find all point indices within radius r of (qx, qy). */
	within(qx: number, qy: number, r: number): number[] {
		const { ids, coords, nodeSize } = this;
		const stack = [0, ids.length - 1, 0];
		const result: number[] = [];
		const r2 = r * r;

		while (stack.length) {
			const axis = stack.pop()!;
			const right = stack.pop()!;
			const left = stack.pop()!;

			if (right - left <= nodeSize) {
				for (let i = left; i <= right; i++) {
					const dx = coords[2 * i]! - qx;
					const dy = coords[2 * i + 1]! - qy;
					if (dx * dx + dy * dy <= r2) result.push(ids[i]!);
				}
				continue;
			}

			const m = (left + right) >> 1;
			const x = coords[2 * m]!;
			const y = coords[2 * m + 1]!;
			const dx = x - qx;
			const dy = y - qy;
			if (dx * dx + dy * dy <= r2) result.push(ids[m]!);

			if (axis === 0 ? qx - r <= x : qy - r <= y) {
				stack.push(left, m - 1, 1 - axis);
			}
			if (axis === 0 ? qx + r >= x : qy + r >= y) {
				stack.push(m + 1, right, 1 - axis);
			}
		}

		return result;
	}

	/** Find all point indices within bounding box. */
	range(minX: number, minY: number, maxX: number, maxY: number): number[] {
		const { ids, coords, nodeSize } = this;
		const stack = [0, ids.length - 1, 0];
		const result: number[] = [];

		while (stack.length) {
			const axis = stack.pop()!;
			const right = stack.pop()!;
			const left = stack.pop()!;

			if (right - left <= nodeSize) {
				for (let i = left; i <= right; i++) {
					const x = coords[2 * i]!;
					const y = coords[2 * i + 1]!;
					if (x >= minX && x <= maxX && y >= minY && y <= maxY) result.push(ids[i]!);
				}
				continue;
			}

			const m = (left + right) >> 1;
			const x = coords[2 * m]!;
			const y = coords[2 * m + 1]!;
			if (x >= minX && x <= maxX && y >= minY && y <= maxY) result.push(ids[m]!);

			if (axis === 0 ? minX <= x : minY <= y) {
				stack.push(left, m - 1, 1 - axis);
			}
			if (axis === 0 ? maxX >= x : maxY >= y) {
				stack.push(m + 1, right, 1 - axis);
			}
		}

		return result;
	}
}

function kdSort(ids: Uint32Array, coords: Float32Array, nodeSize: number, left: number, right: number, axis: number): void {
	if (right - left <= nodeSize) return;
	const m = (left + right) >> 1;
	kdSelect(ids, coords, m, left, right, axis);
	kdSort(ids, coords, nodeSize, left, m - 1, 1 - axis);
	kdSort(ids, coords, nodeSize, m + 1, right, 1 - axis);
}

function kdSelect(ids: Uint32Array, coords: Float32Array, k: number, left: number, right: number, axis: number): void {
	while (right > left) {
		if (right - left > 600) {
			const n = right - left + 1;
			const m = k - left + 1;
			const z = Math.log(n);
			const s = 0.5 * Math.exp((2 * z) / 3);
			const sd = 0.5 * Math.sqrt((z * s * (n - s)) / n) * (m - n / 2 < 0 ? -1 : 1);
			const newLeft = Math.max(left, Math.floor(k - (m * s) / n + sd));
			const newRight = Math.min(right, Math.floor(k + ((n - m) * s) / n + sd));
			kdSelect(ids, coords, k, newLeft, newRight, axis);
		}

		const t = coords[2 * k + axis]!;
		let i = left;
		let j = right;

		kdSwapItem(ids, coords, left, k);
		if (coords[2 * right + axis]! > t) kdSwapItem(ids, coords, left, right);

		while (i < j) {
			kdSwapItem(ids, coords, i, j);
			i++;
			j--;
			while (coords[2 * i + axis]! < t) i++;
			while (coords[2 * j + axis]! > t) j--;
		}

		if (coords[2 * left + axis] === t) kdSwapItem(ids, coords, left, j);
		else {
			j++;
			kdSwapItem(ids, coords, j, right);
		}

		if (j <= k) left = j + 1;
		if (k <= j) right = j - 1;
	}
}

function kdSwapItem(ids: Uint32Array, coords: Float32Array, i: number, j: number): void {
	kdSwap(ids, i, j);
	kdSwap(coords, 2 * i, 2 * j);
	kdSwap(coords, 2 * i + 1, 2 * j + 1);
}

function kdSwap(arr: Uint32Array | Float32Array, i: number, j: number): void {
	const tmp = arr[i]!;
	arr[i] = arr[j]!;
	arr[j] = tmp;
}

// ── Hierarchical clustering engine ──────────────────────────────────────

// Flat data array offsets (per point/cluster entry, stride=6)
const STRIDE = 6;
const OFF_ZOOM = 2; // last zoom this point was processed at
const OFF_IDX = 3; // original marker index
const OFF_PARENT = 4; // parent cluster id
const OFF_COUNT = 5; // number of points in cluster (1 for individual)

const fround = Math.fround || ((x: number) => x);

export class ClusterEngine {
	private _trees: KDTree[] = [];
	private _markers: MarkerInternal[] = [];
	private _loaded = false;
	private _lastMarkerCount = 0;
	private _lastMarkerCoords = new Float64Array(0);
	private _lastMarkersRef: MarkerInternal[] | null = null;
	private _lastRadius = -1;
	private _lastMinSize = -1;
	private _cachedZoom = -1;
	private _cachedIncludeBounds = false;
	private _cachedIncludeMembers = false;
	private _cached: ClusterResult | null = null;
	private _imageMaxZoom = 5;
	private _firstLeafCache = new Map<number, number>();

	/**
	 * Compute clusters at the given zoom level.
	 *
	 * On first call (or when markers change), builds the full hierarchical index.
	 * Subsequent calls for different zoom levels return pre-computed results.
	 */
	compute(markers: MarkerInternal[], zoom: number, radius: number, minSize: number, imageMaxZoom: number, includeBounds = false, includeMembers = false): ClusterResult {
		if (!markers.length) {
			this.invalidate();
			this._markers = [];
			this._lastMarkersRef = markers;
			this._lastMarkerCount = 0;
			this._lastMarkerCoords = new Float64Array(0);
			return { clusters: [], singlesIndices: [] };
		}

		const zoomFloor = Math.floor(zoom);
		this._markers = markers;

		let markersChanged = false;
		if (markers !== this._lastMarkersRef) {
			markersChanged = this._haveMarkerCoordinatesChanged(markers);
			this._lastMarkersRef = markers;
			if (markersChanged) this._captureMarkerCoordinates(markers);
		}

		// Rebuild index if markers, radius or minSize changed
		const needsRebuild =
			!this._loaded ||
			markersChanged ||
			radius !== this._lastRadius ||
			minSize !== this._lastMinSize ||
			imageMaxZoom !== this._imageMaxZoom;

		if (needsRebuild) {
			this._lastRadius = radius;
			this._lastMinSize = minSize;
			this._imageMaxZoom = imageMaxZoom;
			this._firstLeafCache.clear();
			this._buildIndex(markers, radius, minSize, imageMaxZoom);
			this._loaded = true;
			this._cachedZoom = -1;
			this._cachedIncludeBounds = false;
			this._cachedIncludeMembers = false;
			this._cached = null;
		}

		// Return cached result for this zoom
		if (zoomFloor === this._cachedZoom && includeBounds === this._cachedIncludeBounds && includeMembers === this._cachedIncludeMembers && this._cached) {
			return this._cached;
		}

		const result = this._getClustersAtZoom(zoomFloor, includeBounds, includeMembers);
		this._cachedZoom = zoomFloor;
		this._cachedIncludeBounds = includeBounds;
		this._cachedIncludeMembers = includeMembers;
		this._cached = result;
		return result;
	}

	invalidate(): void {
		this._loaded = false;
		this._cached = null;
		this._cachedZoom = -1;
		this._cachedIncludeBounds = false;
		this._cachedIncludeMembers = false;
		this._trees = [];
		this._firstLeafCache.clear();
	}

	/**
	 * Build hierarchical cluster index across all zoom levels.
	 * Adapts Supercluster algorithm for pixel CRS.
	 */
	private _buildIndex(markers: MarkerInternal[], radius: number, minPoints: number, imageMaxZoom: number): void {
		const maxZoom = imageMaxZoom;
		const minZoom = 0;

		// Normalize marker coordinates to [0, 1] range based on bounding box
		// Use the full image extent (2^imageMaxZoom tile pixels) as the normalization base
		const extent = Math.pow(2, imageMaxZoom) * 256; // total world pixel extent

		// Build initial flat data array
		const data: number[] = [];
		for (let i = 0; i < markers.length; i++) {
			const m = markers[i]!;
			const nx = fround(m.x / extent);
			const ny = fround(m.y / extent);
			data.push(
				nx, // normalized x
				ny, // normalized y
				Infinity, // last processed zoom
				i, // original marker index
				-1, // parent cluster id
				1, // point count
			);
		}

		// Create KD-tree at maxZoom + 1 (leaf level with all individual points)
		this._trees = new Array(maxZoom + 2);
		this._trees[maxZoom + 1] = this._createTree(data);

		// Cluster from maxZoom down to minZoom, building a hierarchy
		for (let z = maxZoom; z >= minZoom; z--) {
			const clustered = this._clusterAtZoom(this._trees[z + 1]!, z, radius, minPoints);
			this._trees[z] = this._createTree(clustered);
		}
	}

	/** Create a KD-tree from flat data. */
	private _createTree(data: number[]): KDTree {
		const numItems = (data.length / STRIDE) | 0;
		const tree = new KDTree(numItems, 64);
		for (let i = 0; i < data.length; i += STRIDE) {
			tree.add(data[i]!, data[i + 1]!);
		}
		tree.finish();
		tree.data = data;
		return tree;
	}

	/**
	 * Cluster points at a specific zoom level.
	 * For each unprocessed point, find neighbors within radius, merge into weighted cluster.
	 */
	private _clusterAtZoom(tree: KDTree, zoom: number, radius: number, minPoints: number): number[] {
		// Convert screen-pixel radius to normalized coordinate radius at this zoom
		// At zoom z, 1 screen pixel = 1 / (extent * 2^(z - imageMaxZoom)) normalized units
		// But extent = 2^imageMaxZoom * 256, so:
		// r_normalized = radius / (256 * 2^z)
		const r = radius / (256 * Math.pow(2, zoom));

		const data = tree.data;
		const nextData: number[] = [];
		const markerCount = this._markers.length;

		for (let i = 0; i < data.length; i += STRIDE) {
			// Skip if already processed at this or lower zoom
			if (data[i + OFF_ZOOM]! <= zoom) continue;
			data[i + OFF_ZOOM] = zoom;

			const x = data[i]!;
			const y = data[i + 1]!;
			const neighborIds = tree.within(x, y, r);

			const numPointsOrigin = data[i + OFF_COUNT]!;
			let numPoints = numPointsOrigin;

			// Count unprocessed neighbor points
			for (const nId of neighborIds) {
				const k = nId * STRIDE;
				if (data[k + OFF_ZOOM]! > zoom) numPoints += data[k + OFF_COUNT]!;
			}

			if (numPoints > numPointsOrigin && numPoints >= minPoints) {
				// Form a cluster: weighted centroid
				let wx = x * numPointsOrigin;
				let wy = y * numPointsOrigin;

				// Encode cluster id: (index << 5) + (zoom + 1) + markerCount
				const id = (((i / STRIDE) | 0) << 5) + (zoom + 1) + markerCount;

				for (const nId of neighborIds) {
					const k = nId * STRIDE;
					if (data[k + OFF_ZOOM]! <= zoom) continue;
					data[k + OFF_ZOOM] = zoom;

					const np = data[k + OFF_COUNT]!;
					wx += data[k]! * np;
					wy += data[k + 1]! * np;
					data[k + OFF_PARENT] = id;
				}

				data[i + OFF_PARENT] = id;
				nextData.push(wx / numPoints, wy / numPoints, Infinity, id, -1, numPoints);
			} else {
				// Not enough neighbors: pass through as individual points
				for (let j = 0; j < STRIDE; j++) nextData.push(data[i + j]!);

				if (numPoints > 1) {
					for (const nId of neighborIds) {
						const k = nId * STRIDE;
						if (data[k + OFF_ZOOM]! <= zoom) continue;
						data[k + OFF_ZOOM] = zoom;
						for (let j = 0; j < STRIDE; j++) nextData.push(data[k + j]!);
					}
				}
			}
		}

		return nextData;
	}

	/** Extract clusters and singles at a given zoom from the pre-built index. */
	private _getClustersAtZoom(zoom: number, includeBounds: boolean, includeMembers: boolean): ClusterResult {
		const clampedZoom = Math.max(0, Math.min(zoom, this._trees.length - 1));
		const tree = this._trees[clampedZoom];
		if (!tree) return { clusters: [], singlesIndices: [] };

		const data = tree.data;
		const markers = this._markers;
		const extent = Math.pow(2, this._imageMaxZoom) * 256;

		const clusters: ClusterData[] = [];
		const singlesIndices: number[] = [];
		let clusterIdx = 0;

		for (let i = 0; i < data.length; i += STRIDE) {
			const count = data[i + OFF_COUNT]!;
			const nx = data[i]!;
			const ny = data[i + 1]!;
			// Convert back from normalized to world pixels
			const worldX = nx * extent;
			const worldY = ny * extent;

			if (count === 1) {
				// Single marker
				const origIdx = data[i + OFF_IDX]!;
				if (origIdx >= 0 && origIdx < markers.length) {
					singlesIndices.push(origIdx);
				}
			} else {
				const sourceId = data[i + OFF_IDX]!;
				const representativeIndex = this._getFirstLeafIndex(sourceId, clampedZoom);
				if (representativeIndex < 0 || representativeIndex >= markers.length) continue;

				let memberIndices: number[] = [];
				let hullPoints: { x: number; y: number }[] = [];
				if (includeBounds || includeMembers) {
					// Expand full membership only when requested by caller.
					memberIndices = this._getLeafIndices(sourceId, clampedZoom);
				}
				if (includeBounds) {
					const points = memberIndices.map((idx) => markers[idx]).filter((m): m is MarkerInternal => !!m).map((m) => ({ x: m.x, y: m.y }));
					hullPoints = points.length >= 3 ? convexHull(points) : points;
				}

				clusters.push({
					id: `cluster_${clusterIdx++}`,
					x: worldX,
					y: worldY,
					representativeIndex,
					markerIndices: memberIndices,
					size: count,
					bounds: hullPoints,
					sourceId,
					sourceZoom: clampedZoom,
				});
			}
		}

		return { clusters, singlesIndices };
	}

	/** Walk the cluster hierarchy to find all leaf marker indices. */
	private _getLeafIndices(clusterId: number, zoom: number): number[] {
		const markerCount = this._markers.length;
		const result: number[] = [];
		const stack: { id: number; z: number }[] = [{ id: clusterId, z: zoom }];

		while (stack.length > 0) {
			const { id } = stack.pop()!;

			// If id < markerCount, it's an original marker index
			if (id < markerCount) {
				result.push(id);
				continue;
			}

			// Decode cluster: originIndex and originZoom
			const originIndex = (id - markerCount) >> 5;
			const originZoom = (id - markerCount) % 32;

			const tree = this._trees[originZoom];
			if (!tree) continue;

			const treeData = tree.data;
			const itemCount = (treeData.length / STRIDE) | 0;
			if (originIndex >= itemCount) continue;

			// Find the cluster's position and search for its children
			const cx = treeData[originIndex * STRIDE]!;
			const cy = treeData[originIndex * STRIDE + 1]!;
			const r = this._lastRadius / (256 * Math.pow(2, originZoom - 1));

			const childTree = this._trees[originZoom];
			if (!childTree) continue;

			const neighborIds = childTree.within(cx, cy, r);
			for (const nId of neighborIds) {
				const k = nId * STRIDE;
				const parentId = childTree.data[k + OFF_PARENT];
				if (parentId !== id) continue;

				const childCount = childTree.data[k + OFF_COUNT]!;
				const childId = childTree.data[k + OFF_IDX]!;

				if (childCount === 1) {
					// Leaf marker
					if (childId >= 0 && childId < markerCount) {
						result.push(childId);
					}
				} else {
					// Sub-cluster: recurse
					stack.push({ id: childId, z: originZoom });
				}
			}
		}

		return result;
	}

	resolveMarkerIndices(cluster: ClusterData): number[] {
		if (cluster.markerIndices.length > 0) return cluster.markerIndices;
		const resolved = this._getLeafIndices(cluster.sourceId, cluster.sourceZoom);
		cluster.markerIndices = resolved;
		return resolved;
	}

	private _getFirstLeafIndex(clusterId: number, zoom: number): number {
		const markerCount = this._markers.length;
		if (clusterId < markerCount) return clusterId;

		const cached = this._firstLeafCache.get(clusterId);
		if (cached !== undefined) return cached;

		const stack: { id: number; z: number }[] = [{ id: clusterId, z: zoom }];
		while (stack.length > 0) {
			const { id } = stack.pop()!;
			if (id < markerCount) {
				this._firstLeafCache.set(clusterId, id);
				return id;
			}

			const originIndex = (id - markerCount) >> 5;
			const originZoom = (id - markerCount) % 32;
			const tree = this._trees[originZoom];
			if (!tree) continue;

			const treeData = tree.data;
			const itemCount = (treeData.length / STRIDE) | 0;
			if (originIndex >= itemCount) continue;

			const cx = treeData[originIndex * STRIDE]!;
			const cy = treeData[originIndex * STRIDE + 1]!;
			const r = this._lastRadius / (256 * Math.pow(2, originZoom - 1));
			const neighborIds = tree.within(cx, cy, r);

			for (const nId of neighborIds) {
				const k = nId * STRIDE;
				if (tree.data[k + OFF_PARENT] !== id) continue;
				const childCount = tree.data[k + OFF_COUNT]!;
				const childId = tree.data[k + OFF_IDX]!;
				if (childCount === 1 && childId >= 0 && childId < markerCount) {
					this._firstLeafCache.set(clusterId, childId);
					return childId;
				}
				stack.push({ id: childId, z: originZoom });
			}
		}

		return -1;
	}

	private _haveMarkerCoordinatesChanged(markers: MarkerInternal[]): boolean {
		if (markers.length !== this._lastMarkerCount) return true;
		if (this._lastMarkerCoords.length !== markers.length * 2) return true;

		for (let i = 0; i < markers.length; i++) {
			const m = markers[i]!;
			const j = i * 2;
			if (this._lastMarkerCoords[j] !== m.x || this._lastMarkerCoords[j + 1] !== m.y) return true;
		}
		return false;
	}

	private _captureMarkerCoordinates(markers: MarkerInternal[]): void {
		const coords = new Float64Array(markers.length * 2);
		for (let i = 0; i < markers.length; i++) {
			const m = markers[i]!;
			const j = i * 2;
			coords[j] = m.x;
			coords[j + 1] = m.y;
		}
		this._lastMarkerCount = markers.length;
		this._lastMarkerCoords = coords;
	}
}
