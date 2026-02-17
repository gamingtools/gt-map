# Clustered Layer Implementation Plan

## Overview

Add a new `ClusteredLayer` layer type that combines `InteractiveLayer` (markers + icons + hit-testing) with `StaticLayer` (Canvas2D vector rendering) to provide spatial clustering with:
- Cluster icon sizing based on cluster size (with built-in templates)
- Optional cluster boundary polygons (convex hull, with fill/border styling)
- Cluster-aware events that include both marker data and cluster metadata

## New Files

### 1. `packages/gtmap/src/api/layers/clustered-layer.ts` -- Public API layer class

```
ClusteredLayerOptions {
  clusterRadius: number;              // pixel radius for grouping (default 80)
  minClusterSize: number;             // min markers to form cluster (default 2)
  clusterIconSizeFunction: ClusterIconSizeFunction;  // (clusterSize) => scale
  boundary?: ClusterBoundaryOptions;  // optional boundary polygon config
}

ClusterBoundaryOptions {
  fill?: boolean;          // default true
  fillColor?: string;      // default 'rgba(0,100,255,0.1)'
  fillOpacity?: number;    // default 0.15
  color?: string;          // border color, default 'rgba(0,100,255,0.4)'
  weight?: number;         // border weight, default 1.5
  opacity?: number;        // border opacity, default 0.6
}

ClusterIconSizeFunction = (clusterSize: number) => number;  // returns scale multiplier

// Built-in templates:
ClusterIconSizeTemplates = {
  linear: (size) => 0.8 + size * 0.05,
  logarithmic: (size) => 0.8 + Math.log2(size) * 0.3,
  stepped: (size) => size < 10 ? 1 : size < 50 ? 1.5 : 2,
}
```

Class `ClusteredLayer`:
- `type = 'clustered'` discriminator
- `id` prefix: `cl_<seq>`
- `markers: EntityCollection<Marker>` -- user adds markers normally
- `addMarker(x, y, opts): Marker` -- convenience (same as InteractiveLayer)
- `clearMarkers(): void`
- `addIcon() / loadSpriteAtlas()` -- same icon API as InteractiveLayer
- `setClusterOptions(opts: Partial<ClusteredLayerOptions>): void` -- update at runtime
- `getClusters(): ClusterSnapshot[]` -- read current clusters (for external use)
- Internal `_wire(vis, deps)` with `ClusteredLayerDeps`
- Dirty tracking + RAF batching (same pattern)

### 2. `packages/gtmap/src/internal/layers/clustered-layer-renderer.ts` -- Renderer

Composes:
- `IconManager` (from existing markers system) -- renders cluster icons AND individual (unclustered) markers
- `MarkerEventManager` (from existing) -- hit-testing on clusters AND individual markers
- `VectorLayer` (from existing) -- renders optional boundary polygons
- `LayerFBO` -- opacity compositing
- `ClusterEngine` -- the clustering algorithm

Implements `LayerRendererHandle`:
- `render()` -- draws icons (clusters + singles) via IconManager, then boundary polygons via VectorLayer overlay
- `prepareFrame()` -- rasterize boundary polygons to canvas (like StaticLayerRenderer)
- `dispose()`, `rebuild()`, `resize()`, `requestMaskBuild()` -- lifecycle

Key flow:
1. When markers change OR zoom changes -> `ClusterEngine.compute()`
2. Engine outputs `ClusterResult { clusters: Cluster[], singles: MarkerInternal[] }`
3. Clusters become synthetic MarkerInternal entries (positioned at cluster centroid, sized via clusterIconSizeFunction)
4. Singles remain as-is
5. Both are passed to IconManager for rendering
6. If boundaries enabled, convex hulls are computed and passed to VectorLayer

### 3. `packages/gtmap/src/internal/layers/cluster-engine.ts` -- Clustering algorithm

```
ClusterEngine {
  compute(markers: MarkerInternal[], zoom: number, radius: number, minSize: number): ClusterResult
}

ClusterResult {
  clusters: ClusterData[]
  singles: MarkerInternal[]
}

ClusterData {
  id: string            // e.g. 'cluster_0'
  x: number             // centroid x
  y: number             // centroid y
  markers: MarkerInternal[]  // member markers
  size: number           // markers.length
  bounds: { x: number; y: number }[]  // convex hull points (for boundary)
}
```

Algorithm: grid-based spatial clustering
- Grid cell size = `radius / 2^(imageMaxZoom - zoom)` (scale-aware)
- Hash markers into grid cells
- For each cell with >= minSize markers: form cluster at centroid
- Cells with < minSize: emit as singles
- Cache results keyed by `zoom_floor + markers_hash` to avoid recomputation
- Convex hull via Graham scan (simple, correct, O(n log n))

### 4. `packages/gtmap/src/internal/layers/convex-hull.ts` -- Convex hull utility

Small standalone function: `convexHull(points: {x,y}[]): {x,y}[]`
Graham scan implementation. Used by ClusterEngine for boundary polygons.

## Modified Files

### 5. `packages/gtmap/src/api/layers/types.ts`

- Add `'clustered'` to `LayerType` union
- Export `ClusteredLayerOptions`, `ClusterBoundaryOptions`, `ClusterIconSizeFunction`, `ClusterIconSizeTemplates`
- Export `ClusterSnapshot` (public read-only cluster info for `getClusters()`)

### 6. `packages/gtmap/src/api/layers/index.ts`

- Export `ClusteredLayer`

### 7. `packages/gtmap/src/internal/layers/layer-registry.ts`

- Add `ClusteredLayer` to `AnyLayer` union type
- Add `'clustered'` to `getInteractiveSortedReverse()` filter (clusters are interactive for hit-testing)

### 8. `packages/gtmap/src/api/facades/layers-facade.ts`

- Add `createClusteredLayer(opts: ClusteredLayerOptions): ClusteredLayer` method
- Add to `LayersFacadeDeps` interface

### 9. `packages/gtmap/src/api/map.ts`

- Import `ClusteredLayer`, `ClusteredLayerRenderer`
- Add `createClusteredLayer` factory to LayersFacade deps wiring:
  - Create `ClusteredLayer` instance
  - Create `ClusteredLayerRenderer` with deps (combines InteractiveLayerRenderer + StaticLayerRenderer deps)
  - Wire `_wire(sharedVis, deps)` -- deps include cluster-specific methods
  - Push to `_createdLayers`
- Add `layer.type === 'clustered'` branch in `addLayer`:
  - Register renderer, init if GL ready
- Add `'clustered'` to `setIconScaleFunction` iteration (line 126)

### 10. `packages/gtmap/src/index.ts`

- Export `ClusteredLayer`
- Export types: `ClusteredLayerOptions`, `ClusterBoundaryOptions`, `ClusterIconSizeFunction`, `ClusterIconSizeTemplates`, `ClusterSnapshot`
- Export `ClusterEventData` type

### 11. `packages/gtmap/src/api/events/maps.ts`

- Add `ClusterData` interface (public snapshot of cluster info in events):
  ```
  ClusterData {
    clusterId: string;
    size: number;
    center: { x: number; y: number };
    markerIds: string[];
  }
  ```
- Add `ClusterEventData` to `MarkerEventData` -- extend existing marker event data with optional `cluster?: ClusterData` field

### 12. `packages/gtmap/src/api/types.ts`

- Add `cluster?: ClusterData` to `MarkerEventData` interface (so when a cluster icon is hovered/clicked, the event includes cluster metadata alongside the representative marker)

## Event Design

When a cluster icon is interacted with:
- `marker` field = the first marker in the cluster (markers[0]) -- provides `.data` for display
- `cluster` field = `{ clusterId, size, center, markerIds }` -- cluster metadata
- Use case: `"19 copper nodes"` = `marker.data.label` + `cluster.size`

When an individual (unclustered) marker is interacted with:
- `marker` field = that marker's data (same as InteractiveLayer)
- `cluster` field = undefined (not part of a cluster)

Events flow through the same `MarkerEventManager` pipeline. The ClusteredLayerRenderer maps synthetic cluster marker IDs back to cluster metadata before emitting.

## Rendering Flow Per Frame

1. `prepareFrame()`:
   - If markers or zoom changed: run `ClusterEngine.compute()`
   - Convert clusters to synthetic MarkerInternal[] (with cluster icon size)
   - Merge with singles
   - Send to `IconManager.setMarkers()`
   - If boundaries enabled: compute convex hulls, send to `VectorLayer.setVectors()`
   - Rasterize boundaries via `VectorLayer.draw()`

2. `render()`:
   - Draw icons (clusters + singles) via IconManager
   - Draw boundary overlays via VectorLayer
   - Handle FBO opacity compositing

## Build Sequence

1. `convex-hull.ts` -- standalone utility, no deps
2. `cluster-engine.ts` -- depends on convex-hull
3. `types.ts` updates -- LayerType, options, event data
4. `maps.ts` updates -- ClusterData type
5. `api/types.ts` updates -- MarkerEventData extension
6. `clustered-layer.ts` -- public API class
7. `clustered-layer-renderer.ts` -- renderer implementation
8. `layer-registry.ts` -- AnyLayer union update
9. `layers-facade.ts` -- createClusteredLayer method
10. `map.ts` -- factory wiring + addLayer branch
11. `index.ts` -- exports
12. `layers/index.ts` -- export
