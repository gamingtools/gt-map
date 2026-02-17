[**@gaming.tools/gtmap**](README.md)

***

# Interface: ClusterEventData

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [center](#center)
  - [clusterId](#clusterid)
  - [markerIds](#markerids)
  - [size](#size)

Defined in: [api/layers/types.ts:108](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/types.ts#L108)

Cluster metadata included in marker event payloads when the hit target is a cluster icon.

## Properties

### center

> **center**: `object`

Defined in: [api/layers/types.ts:114](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/types.ts#L114)

Centroid position in world pixels.

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### clusterId

> **clusterId**: `string`

Defined in: [api/layers/types.ts:110](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/types.ts#L110)

Cluster identifier.

***

### markerIds

> **markerIds**: `string`[]

Defined in: [api/layers/types.ts:116](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/types.ts#L116)

IDs of all markers in this cluster.

***

### size

> **size**: `number`

Defined in: [api/layers/types.ts:112](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/types.ts#L112)

Number of markers in this cluster.
