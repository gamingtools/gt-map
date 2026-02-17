[**@gaming.tools/gtmap**](README.md)

***

# Class: ClusteredLayer

Defined in: [api/layers/clustered-layer.ts:26](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L26)

A layer that spatially clusters markers and renders cluster icons
with optional boundary polygons.

## Remarks

Create via `map.layers.createClusteredLayer(opts?)`, then attach
with `map.layers.addLayer(layer, { z })`.

## Constructors

### Constructor

> **new ClusteredLayer**(`opts?`): `ClusteredLayer`

Defined in: [api/layers/clustered-layer.ts:59](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L59)

#### Parameters

##### opts?

[`ClusteredLayerOptions`](Interface.ClusteredLayerOptions.md)

#### Returns

`ClusteredLayer`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [api/layers/clustered-layer.ts:28](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L28)

***

### markers

> `readonly` **markers**: [`EntityCollection`](Class.EntityCollection.md)\<[`Marker`](Class.Marker.md)\>

Defined in: [api/layers/clustered-layer.ts:31](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L31)

Marker collection for this layer.

***

### type

> `readonly` **type**: `"clustered"`

Defined in: [api/layers/clustered-layer.ts:27](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L27)

## Accessors

### boundary

#### Get Signature

> **get** **boundary**(): `undefined` \| [`ClusterBoundaryOptions`](Interface.ClusterBoundaryOptions.md)

Defined in: [api/layers/clustered-layer.ts:87](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L87)

Current boundary options (undefined = boundaries disabled).

##### Returns

`undefined` \| [`ClusterBoundaryOptions`](Interface.ClusterBoundaryOptions.md)

***

### clusterIconSizeFunction

#### Get Signature

> **get** **clusterIconSizeFunction**(): [`ClusterIconSizeFunction`](TypeAlias.ClusterIconSizeFunction.md)

Defined in: [api/layers/clustered-layer.ts:83](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L83)

Current cluster icon size function.

##### Returns

[`ClusterIconSizeFunction`](TypeAlias.ClusterIconSizeFunction.md)

***

### clusterRadius

#### Get Signature

> **get** **clusterRadius**(): `number`

Defined in: [api/layers/clustered-layer.ts:75](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L75)

Current cluster radius in world pixels.

##### Returns

`number`

***

### minClusterSize

#### Get Signature

> **get** **minClusterSize**(): `number`

Defined in: [api/layers/clustered-layer.ts:79](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L79)

Current minimum cluster size.

##### Returns

`number`

## Methods

### addIcon()

> **addIcon**(`def`, `id?`): [`IconHandle`](Interface.IconHandle.md)

Defined in: [api/layers/clustered-layer.ts:130](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L130)

Register an icon definition for use with markers on this layer.

#### Parameters

##### def

[`IconDef`](Interface.IconDef.md)

The icon definition (image path, dimensions, anchor).

##### id?

`string`

Optional custom identifier; auto-generated if omitted.

#### Returns

[`IconHandle`](Interface.IconHandle.md)

A handle containing the resolved icon id.

***

### addMarker()

> **addMarker**(`x`, `y`, `opts`): [`Marker`](Class.Marker.md)

Defined in: [api/layers/clustered-layer.ts:169](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L169)

Add a marker at the given world-pixel position.

#### Parameters

##### x

`number`

Horizontal position in world pixels.

##### y

`number`

Vertical position in world pixels.

##### opts

[`MarkerOptions`](Interface.MarkerOptions.md)

Marker options (visual, scale, data, etc.).

#### Returns

[`Marker`](Class.Marker.md)

The created Marker entity.

***

### clearMarkers()

> **clearMarkers**(): `void`

Defined in: [api/layers/clustered-layer.ts:177](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L177)

Remove all markers from this layer.

#### Returns

`void`

***

### getClusters()

> **getClusters**(): [`ClusterSnapshot`](Interface.ClusterSnapshot.md)[]

Defined in: [api/layers/clustered-layer.ts:111](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L111)

Get a read-only snapshot of the current clusters.

#### Returns

[`ClusterSnapshot`](Interface.ClusterSnapshot.md)[]

***

### loadSpriteAtlas()

> **loadSpriteAtlas**(`atlasImageUrl`, `descriptor`, `atlasId?`): `Promise`\<[`SpriteAtlasHandle`](Interface.SpriteAtlasHandle.md)\>

Defined in: [api/layers/clustered-layer.ts:153](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L153)

Load a sprite atlas image and register all sprites described by the descriptor.

#### Parameters

##### atlasImageUrl

`string`

URL of the atlas PNG image.

##### descriptor

[`SpriteAtlasDescriptor`](Interface.SpriteAtlasDescriptor.md)

Sprite positions and dimensions within the atlas.

##### atlasId?

`string`

Optional custom atlas identifier; auto-generated if omitted.

#### Returns

`Promise`\<[`SpriteAtlasHandle`](Interface.SpriteAtlasHandle.md)\>

A handle containing the atlas id and a map of sprite name to internal icon id.

***

### setClusterOptions()

> **setClusterOptions**(`opts`): `void`

Defined in: [api/layers/clustered-layer.ts:94](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/clustered-layer.ts#L94)

Update cluster options at runtime. Triggers a re-cluster on next frame.

#### Parameters

##### opts

`Partial`\<[`ClusteredLayerOptions`](Interface.ClusteredLayerOptions.md)\>

#### Returns

`void`
