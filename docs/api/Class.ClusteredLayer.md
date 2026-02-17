[**@gaming.tools/gtmap**](README.md)

***

# Class: ClusteredLayer

[← Back to API index](./README.md)

## Contents

- [Constructors](#constructors)
  - [Constructor](#constructor)
- [Properties](#properties)
  - [id](#id)
  - [markers](#markers)
  - [type](#type)
- [Accessors](#accessors)
  - [boundary](#boundary)
  - [clusterIconSizeFunction](#clustericonsizefunction)
  - [clusterRadius](#clusterradius)
  - [minClusterSize](#minclustersize)
- [Methods](#methods)
  - [addIcon()](#addicon)
  - [addMarker()](#addmarker)
  - [clearMarkers()](#clearmarkers)
  - [getClusters()](#getclusters)
  - [loadSpriteAtlas()](#loadspriteatlas)
  - [setClusterOptions()](#setclusteroptions)

Defined in: [api/layers/clustered-layer.ts:17](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L17)

## Constructors

### Constructor

> **new ClusteredLayer**(`opts?`): `ClusteredLayer`

Defined in: [api/layers/clustered-layer.ts:50](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L50)

#### Parameters

##### opts?

[`ClusteredLayerOptions`](Interface.ClusteredLayerOptions.md)

#### Returns

`ClusteredLayer`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [api/layers/clustered-layer.ts:19](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L19)

***

### markers

> `readonly` **markers**: [`EntityCollection`](Class.EntityCollection.md)\<[`Marker`](Class.Marker.md)\>

Defined in: [api/layers/clustered-layer.ts:22](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L22)

Marker collection for this layer.

***

### type

> `readonly` **type**: `"clustered"`

Defined in: [api/layers/clustered-layer.ts:18](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L18)

## Accessors

### boundary

#### Get Signature

> **get** **boundary**(): `undefined` \| [`ClusterBoundaryOptions`](Interface.ClusterBoundaryOptions.md)

Defined in: [api/layers/clustered-layer.ts:78](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L78)

Current boundary options (undefined = boundaries disabled).

##### Returns

`undefined` \| [`ClusterBoundaryOptions`](Interface.ClusterBoundaryOptions.md)

***

### clusterIconSizeFunction

#### Get Signature

> **get** **clusterIconSizeFunction**(): [`ClusterIconSizeFunction`](TypeAlias.ClusterIconSizeFunction.md)

Defined in: [api/layers/clustered-layer.ts:74](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L74)

Current cluster icon size function.

##### Returns

[`ClusterIconSizeFunction`](TypeAlias.ClusterIconSizeFunction.md)

***

### clusterRadius

#### Get Signature

> **get** **clusterRadius**(): `number`

Defined in: [api/layers/clustered-layer.ts:66](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L66)

Current cluster radius in world pixels.

##### Returns

`number`

***

### minClusterSize

#### Get Signature

> **get** **minClusterSize**(): `number`

Defined in: [api/layers/clustered-layer.ts:70](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L70)

Current minimum cluster size.

##### Returns

`number`

## Methods

### addIcon()

> **addIcon**(`def`, `id?`): [`IconHandle`](Interface.IconHandle.md)

Defined in: [api/layers/clustered-layer.ts:115](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L115)

#### Parameters

##### def

[`IconDef`](Interface.IconDef.md)

##### id?

`string`

#### Returns

[`IconHandle`](Interface.IconHandle.md)

***

### addMarker()

> **addMarker**(`x`, `y`, `opts`): [`Marker`](Class.Marker.md)

Defined in: [api/layers/clustered-layer.ts:140](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L140)

#### Parameters

##### x

`number`

##### y

`number`

##### opts

[`MarkerOptions`](Interface.MarkerOptions.md)

#### Returns

[`Marker`](Class.Marker.md)

***

### clearMarkers()

> **clearMarkers**(): `void`

Defined in: [api/layers/clustered-layer.ts:147](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L147)

#### Returns

`void`

***

### getClusters()

> **getClusters**(): [`ClusterSnapshot`](Interface.ClusterSnapshot.md)[]

Defined in: [api/layers/clustered-layer.ts:102](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L102)

Get a read-only snapshot of the current clusters.

#### Returns

[`ClusterSnapshot`](Interface.ClusterSnapshot.md)[]

***

### loadSpriteAtlas()

> **loadSpriteAtlas**(`atlasImageUrl`, `descriptor`, `atlasId?`): `Promise`\<[`SpriteAtlasHandle`](Interface.SpriteAtlasHandle.md)\>

Defined in: [api/layers/clustered-layer.ts:131](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L131)

#### Parameters

##### atlasImageUrl

`string`

##### descriptor

[`SpriteAtlasDescriptor`](Interface.SpriteAtlasDescriptor.md)

##### atlasId?

`string`

#### Returns

`Promise`\<[`SpriteAtlasHandle`](Interface.SpriteAtlasHandle.md)\>

***

### setClusterOptions()

> **setClusterOptions**(`opts`): `void`

Defined in: [api/layers/clustered-layer.ts:85](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/clustered-layer.ts#L85)

Update cluster options at runtime. Triggers a re-cluster on next frame.

#### Parameters

##### opts

`Partial`\<[`ClusteredLayerOptions`](Interface.ClusteredLayerOptions.md)\>

#### Returns

`void`
