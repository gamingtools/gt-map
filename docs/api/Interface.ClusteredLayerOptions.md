[**@gaming.tools/gtmap**](README.md)

***

# Interface: ClusteredLayerOptions

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [boundary?](#boundary)
  - [clusterIconSizeFunction?](#clustericonsizefunction)
  - [clusterRadius?](#clusterradius)
  - [minClusterSize?](#minclustersize)

Defined in: [api/layers/types.ts:82](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/types.ts#L82)

Options for creating a clustered layer.

## Properties

### boundary?

> `optional` **boundary**: [`ClusterBoundaryOptions`](Interface.ClusterBoundaryOptions.md)

Defined in: [api/layers/types.ts:90](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/types.ts#L90)

Optional cluster boundary polygon styling. Omit to disable boundaries.

***

### clusterIconSizeFunction?

> `optional` **clusterIconSizeFunction**: [`ClusterIconSizeFunction`](TypeAlias.ClusterIconSizeFunction.md)

Defined in: [api/layers/types.ts:88](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/types.ts#L88)

Function mapping cluster size to an icon scale multiplier. Default: ClusterIconSizeTemplates.logarithmic.

***

### clusterRadius?

> `optional` **clusterRadius**: `number`

Defined in: [api/layers/types.ts:84](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/types.ts#L84)

Pixel radius for grouping nearby markers into clusters. Default: 80.

***

### minClusterSize?

> `optional` **minClusterSize**: `number`

Defined in: [api/layers/types.ts:86](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/types.ts#L86)

Minimum number of markers to form a cluster. Default: 2.
