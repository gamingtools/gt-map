[**@gaming.tools/gtmap**](README.md)

***

# Interface: ClusteredLayerOptions

Defined in: [api/layers/types.ts:170](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L170)

Options for creating a clustered layer.

## Properties

### boundary?

> `optional` **boundary**: [`ClusterBoundaryOptions`](Interface.ClusterBoundaryOptions.md)

Defined in: [api/layers/types.ts:178](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L178)

Optional cluster boundary polygon styling. Omit to disable boundaries.

***

### clusterIconSizeFunction?

> `optional` **clusterIconSizeFunction**: [`ClusterIconSizeFunction`](TypeAlias.ClusterIconSizeFunction.md)

Defined in: [api/layers/types.ts:176](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L176)

Function mapping cluster size to an icon scale multiplier. Default: clusterIconSize('logarithmic').

***

### clusterRadius?

> `optional` **clusterRadius**: `number`

Defined in: [api/layers/types.ts:172](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L172)

Pixel radius for grouping nearby markers into clusters. Default: 80.

***

### minClusterSize?

> `optional` **minClusterSize**: `number`

Defined in: [api/layers/types.ts:174](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L174)

Minimum number of markers to form a cluster. Default: 2.
