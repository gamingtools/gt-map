[**@gaming.tools/gtmap**](README.md)

***

# Class: InteractiveLayer

Defined in: [api/layers/interactive-layer.ts:21](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/interactive-layer.ts#L21)

A layer that owns markers with WebGL hit-testing support.

## Remarks

Create via `map.layers.createInteractiveLayer()`, then attach
with `map.layers.addLayer(layer, { z })`.

## Constructors

### Constructor

> **new InteractiveLayer**(): `InteractiveLayer`

Defined in: [api/layers/interactive-layer.ts:50](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/interactive-layer.ts#L50)

#### Returns

`InteractiveLayer`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [api/layers/interactive-layer.ts:23](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/interactive-layer.ts#L23)

***

### markers

> `readonly` **markers**: [`EntityCollection`](Class.EntityCollection.md)\<[`Marker`](Class.Marker.md)\>

Defined in: [api/layers/interactive-layer.ts:26](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/interactive-layer.ts#L26)

Marker collection for this layer.

***

### type

> `readonly` **type**: `"interactive"`

Defined in: [api/layers/interactive-layer.ts:22](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/interactive-layer.ts#L22)

## Methods

### addIcon()

> **addIcon**(`def`, `id?`): [`IconHandle`](Interface.IconHandle.md)

Defined in: [api/layers/interactive-layer.ts:68](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/interactive-layer.ts#L68)

Register a bitmap icon for use with markers on this layer.

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

Defined in: [api/layers/interactive-layer.ts:95](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/interactive-layer.ts#L95)

Add a marker at the given world pixel position.

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

Defined in: [api/layers/interactive-layer.ts:103](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/interactive-layer.ts#L103)

Remove all markers from this layer.

#### Returns

`void`

***

### loadSpriteAtlas()

> **loadSpriteAtlas**(`atlasImageUrl`, `descriptor`, `atlasId?`): `Promise`\<[`SpriteAtlasHandle`](Interface.SpriteAtlasHandle.md)\>

Defined in: [api/layers/interactive-layer.ts:85](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/interactive-layer.ts#L85)

Load a sprite atlas image and register all sprites as icons.

#### Parameters

##### atlasImageUrl

`string`

##### descriptor

[`SpriteAtlasDescriptor`](Interface.SpriteAtlasDescriptor.md)

##### atlasId?

`string`

#### Returns

`Promise`\<[`SpriteAtlasHandle`](Interface.SpriteAtlasHandle.md)\>
