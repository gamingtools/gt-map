/**
 * Layer system type definitions.
 */

/** Discriminator for layer types. */
export type LayerType = 'tile' | 'interactive' | 'static';

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
