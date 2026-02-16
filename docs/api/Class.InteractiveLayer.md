[**@gaming.tools/gtmap**](README.md)

***

# Class: InteractiveLayer

[← Back to API index](./README.md)

## Contents

- [Constructors](#constructors)
  - [Constructor](#constructor)
- [Properties](#properties)
  - [id](#id)
  - [markers](#markers)
  - [type](#type)
- [Methods](#methods)
  - [addIcon()](#addicon)
  - [addMarker()](#addmarker)
  - [clearMarkers()](#clearmarkers)
  - [loadSpriteAtlas()](#loadspriteatlas)

Defined in: [api/layers/interactive-layer.ts:13](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/layers/interactive-layer.ts#L13)

## Constructors

### Constructor

> **new InteractiveLayer**(): `InteractiveLayer`

Defined in: [api/layers/interactive-layer.ts:42](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/layers/interactive-layer.ts#L42)

#### Returns

`InteractiveLayer`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [api/layers/interactive-layer.ts:15](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/layers/interactive-layer.ts#L15)

***

### markers

> `readonly` **markers**: [`EntityCollection`](Class.EntityCollection.md)\<[`Marker`](Class.Marker.md)\>

Defined in: [api/layers/interactive-layer.ts:18](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/layers/interactive-layer.ts#L18)

Marker collection for this layer.

***

### type

> `readonly` **type**: `"interactive"`

Defined in: [api/layers/interactive-layer.ts:14](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/layers/interactive-layer.ts#L14)

## Methods

### addIcon()

> **addIcon**(`def`, `id?`): [`IconHandle`](Interface.IconHandle.md)

Defined in: [api/layers/interactive-layer.ts:59](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/layers/interactive-layer.ts#L59)

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

Defined in: [api/layers/interactive-layer.ts:84](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/layers/interactive-layer.ts#L84)

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

Defined in: [api/layers/interactive-layer.ts:91](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/layers/interactive-layer.ts#L91)

#### Returns

`void`

***

### loadSpriteAtlas()

> **loadSpriteAtlas**(`atlasImageUrl`, `descriptor`, `atlasId?`): `Promise`\<[`SpriteAtlasHandle`](Interface.SpriteAtlasHandle.md)\>

Defined in: [api/layers/interactive-layer.ts:75](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/layers/interactive-layer.ts#L75)

#### Parameters

##### atlasImageUrl

`string`

##### descriptor

[`SpriteAtlasDescriptor`](Interface.SpriteAtlasDescriptor.md)

##### atlasId?

`string`

#### Returns

`Promise`\<[`SpriteAtlasHandle`](Interface.SpriteAtlasHandle.md)\>
