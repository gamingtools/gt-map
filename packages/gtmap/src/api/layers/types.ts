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
 * @returns Scale multiplier (1.0 = visual's native size)
 */
export type ClusterIconSizeFunction = (clusterSize: number) => number;

/** Built-in cluster icon size templates. */
const clampClusterScale = (value: number, min = 0.9, max = 2.2): number => Math.max(min, Math.min(max, value));

export const ClusterIconSizeTemplates = {
	/** Linear scaling: smooth growth with a cap to avoid giant cluster icons. */
	linear: (size: number) => clampClusterScale(0.95 + Math.max(0, size - 1) * 0.018, 0.9, 2.2),
	/** Logarithmic scaling: stronger early growth, then tapers for dense clusters. */
	logarithmic: (size: number) => clampClusterScale(0.9 + Math.log2(Math.max(1, size) + 1) * 0.24, 0.9, 2.1),
	/** Stepped scaling: predictable visual tiers for quick density reading. */
	stepped: (size: number) => {
		if (size < 5) return 1.0;
		if (size < 15) return 1.15;
		if (size < 40) return 1.35;
		if (size < 100) return 1.6;
		return 1.85;
	},
} as const satisfies Record<string, ClusterIconSizeFunction>;

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
}

/** Options for creating a clustered layer. */
export interface ClusteredLayerOptions {
	/** Pixel radius for grouping nearby markers into clusters. Default: 80. */
	clusterRadius?: number;
	/** Minimum number of markers to form a cluster. Default: 2. */
	minClusterSize?: number;
	/** Function mapping cluster size to an icon scale multiplier. Default: ClusterIconSizeTemplates.logarithmic. */
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
