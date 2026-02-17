[**@gaming.tools/gtmap**](README.md)

***

# Type Alias: ClusterIconSizeFunction()

> **ClusterIconSizeFunction** = (`clusterSize`, `maxClusterSize`) => `number`

Defined in: [api/layers/types.ts:47](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/types.ts#L47)

Function that maps cluster size to a scale multiplier for the cluster icon.

## Parameters

### clusterSize

`number`

Number of markers in the cluster

### maxClusterSize

`number`

Largest cluster size in this layer at the current zoom level.
  Provided by the renderer on every clustering pass; useful for adaptive scaling.

## Returns

`number`

Scale multiplier (1.0 = visual's native size)
