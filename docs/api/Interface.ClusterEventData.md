[**@gaming.tools/gtmap**](README.md)

***

# Interface: ClusterEventData

Defined in: [api/layers/types.ts:196](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L196)

Cluster metadata included in marker event payloads when the hit target is a cluster icon.

## Properties

### center

> **center**: `object`

Defined in: [api/layers/types.ts:202](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L202)

Centroid position in world pixels.

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### clusterId

> **clusterId**: `string`

Defined in: [api/layers/types.ts:198](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L198)

Cluster identifier.

***

### markerIds

> **markerIds**: `string`[]

Defined in: [api/layers/types.ts:204](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L204)

IDs of all markers in this cluster.

***

### size

> **size**: `number`

Defined in: [api/layers/types.ts:200](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L200)

Number of markers in this cluster.
