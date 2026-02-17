/**
 * Layer system type definitions.
 */

/** Discriminator for layer types. */
export type LayerType = 'tile' | 'interactive' | 'static' | 'clustered';

/** Options passed to `map.addLayer()`. */
export interface AddLayerOptions {
	/** Z-order for stacking (higher = on top). */
	z: number;
	/** Initial visibility. Defaults to true. */
	visible?: boolean;
	/** Layer opacity 0..1. Defaults to 1. */
	opacity?: number;
}

/** Options for creating a tile layer. */
export interface TileLayerOptions {
	/** URL to a `.gtpk` tile pack. */
	packUrl: string;
	/** Tile size in pixels (tiles are always square). */
	tileSize: number;
	/** Minimum zoom level available in the tile set. */
	sourceMinZoom: number;
	/** Maximum zoom level available in the tile set. */
	sourceMaxZoom: number;
}

/** Internal layer state managed by the registry. */
export interface LayerState {
	z: number;
	visible: boolean;
	opacity: number;
}

// -- Clustered layer types --

/**
 * Function that maps cluster size to a scale multiplier for the cluster icon.
 *
 * @param clusterSize - Number of markers in the cluster
 * @param maxClusterSize - Largest cluster size in this layer at the current zoom level.
 *   Provided by the renderer on every clustering pass; useful for adaptive scaling.
 * @returns Scale multiplier (1.0 = visual's native size)
 */
export type ClusterIconSizeFunction = (clusterSize: number, maxClusterSize: number) => number;

/** Cluster icon size scaling mode. */
export type ClusterIconSizeMode = 'linear' | 'logarithmic' | 'stepped' | 'exponentialLog';

/** Options for {@link clusterIconSize}. All fields are optional and have sensible defaults per mode. */
export interface ClusterIconSizeOptions {
	/** Minimum scale multiplier. Default varies by mode (~0.9-1.0). */
	min?: number;
	/** Maximum scale multiplier. Default: 2.0. */
	max?: number;
	/** (stepped) Breakpoints as `[threshold, scale]` pairs, sorted ascending by threshold. */
	steps?: [number, number][];
	/** (exponentialLog) Interpolation base. Default: 1.5. */
	base?: number;
	/**
	 * (exponentialLog) Fixed cluster count treated as the ceiling for interpolation.
	 * When omitted, the function uses the `maxClusterSize` parameter provided by
	 * the renderer (dynamic per-layer ceiling). Set a fixed value to override. Default: undefined (auto).
	 */
	ceiling?: number;
}

/** Per-mode defaults for {@link clusterIconSize}. */
export const clusterIconSizeDefaults: Record<ClusterIconSizeMode, Required<ClusterIconSizeOptions>> = {
	linear:         { min: 0.9, max: 2.0, steps: [], base: 1, ceiling: 1 },
	logarithmic:    { min: 0.9, max: 2.0, steps: [], base: 1, ceiling: 1 },
	stepped:        { min: 0.9, max: 2.0, steps: [[5, 1.0], [15, 1.15], [40, 1.35], [100, 1.6], [Infinity, 1.85]], base: 1, ceiling: 1 },
	exponentialLog: { min: 1.0, max: 2.0, steps: [], base: 1.5, ceiling: 0 },
};

/**
 * Factory for cluster icon size functions.
 *
 * @param mode - Scaling algorithm to use
 * @param opts - Override defaults for the chosen mode
 * @returns A {@link ClusterIconSizeFunction}
 *
 * @example
 * ```ts
 * // Defaults
 * clusterIconSize('logarithmic')
 *
 * // Custom range
 * clusterIconSize('logarithmic', { min: 1.0, max: 1.5 })
 *
 * // Exponential-log with dynamic ceiling (default -- adapts per-layer)
 * clusterIconSize('exponentialLog')
 *
 * // Exponential-log with fixed ceiling
 * clusterIconSize('exponentialLog', { base: 2.0, ceiling: 500, max: 1.8 })
 *
 * // Custom stepped
 * clusterIconSize('stepped', { steps: [[5, 1.0], [20, 1.3], [100, 1.6], [Infinity, 2.0]] })
 * ```
 */
export function clusterIconSize(mode: ClusterIconSizeMode = 'logarithmic', opts?: ClusterIconSizeOptions): ClusterIconSizeFunction {
	const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
	const d = clusterIconSizeDefaults[mode];

	switch (mode) {
		case 'linear': {
			const min = opts?.min ?? d.min;
			const max = opts?.max ?? d.max;
			return (size: number) => clamp(0.95 + Math.max(0, size - 1) * 0.018, min, max);
		}
		case 'logarithmic': {
			const min = opts?.min ?? d.min;
			const max = opts?.max ?? d.max;
			return (size: number) => clamp(0.9 + Math.log2(Math.max(1, size) + 1) * 0.24, min, max);
		}
		case 'stepped': {
			const max = opts?.max ?? d.max;
			const steps = opts?.steps ?? d.steps;
			return (size: number) => {
				for (const [threshold, scale] of steps) {
					if (size < threshold) return Math.min(scale, max);
				}
				return max;
			};
		}
		case 'exponentialLog': {
			const min = opts?.min ?? d.min;
			const max = opts?.max ?? d.max;
			const base = opts?.base ?? d.base;
			const fixedCeiling = opts?.ceiling ?? d.ceiling;
			// Cache lnMax for the current ceiling to avoid recomputing per-cluster.
			let cachedCeiling = 0;
			let lnMax = 0;
			return (size: number, maxClusterSize: number) => {
				const ceiling = fixedCeiling > 0 ? fixedCeiling : Math.max(1, maxClusterSize);
				if (ceiling !== cachedCeiling) {
					cachedCeiling = ceiling;
					lnMax = Math.log(ceiling);
				}
				const lnSize = Math.log(Math.max(1, size));
				const t = Math.min(1, lnSize / lnMax);
				const expT = (Math.pow(base, t) - 1) / (base - 1);
				return clamp(min + (max - min) * expT, min, max);
			};
		}
	}
}

/** Styling options for optional cluster boundary polygons. */
export interface ClusterBoundaryOptions {
	/** Border color. Default: 'rgba(0,100,255,0.4)'. */
	color?: string;
	/** Border weight in pixels. Default: 1.5. */
	weight?: number;
	/** Border opacity (0-1). Default: 1. */
	opacity?: number;
	/** Whether to fill the boundary polygon. Default: true. */
	fill?: boolean;
	/** Fill color. Default: 'rgba(0,100,255,0.1)'. */
	fillColor?: string;
	/** Fill opacity (0-1). Default: 0.15. */
	fillOpacity?: number;
	/** When true, only show the boundary for the hovered cluster. Default: false. */
	showOnHover?: boolean;
}

/** Options for creating a clustered layer. */
export interface ClusteredLayerOptions {
	/** Pixel radius for grouping nearby markers into clusters. Default: 80. */
	clusterRadius?: number;
	/** Minimum number of markers to form a cluster. Default: 2. */
	minClusterSize?: number;
	/** Function mapping cluster size to an icon scale multiplier. Default: clusterIconSize('logarithmic'). */
	clusterIconSizeFunction?: ClusterIconSizeFunction;
	/** Optional cluster boundary polygon styling. Omit to disable boundaries. */
	boundary?: ClusterBoundaryOptions;
}

/** Read-only snapshot of a cluster for external consumption (e.g. getClusters()). */
export interface ClusterSnapshot {
	/** Cluster identifier. */
	id: string;
	/** Centroid X in world pixels. */
	x: number;
	/** Centroid Y in world pixels. */
	y: number;
	/** Number of markers in this cluster. */
	size: number;
	/** IDs of the markers in this cluster. */
	markerIds: string[];
}

/** Cluster metadata included in marker event payloads when the hit target is a cluster icon. */
export interface ClusterEventData {
	/** Cluster identifier. */
	clusterId: string;
	/** Number of markers in this cluster. */
	size: number;
	/** Centroid position in world pixels. */
	center: { x: number; y: number };
	/** IDs of all markers in this cluster. */
	markerIds: string[];
}
