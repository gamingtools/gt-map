[**@gaming.tools/gtmap**](README.md)

***

# Class: ContentFacade

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [markers](#markers)
  - [vectors](#vectors)
- [Methods](#methods)
  - [addIcon()](#addicon)
  - [addMarker()](#addmarker)
  - [addVector()](#addvector)
  - [clearMarkers()](#clearmarkers)
  - [clearVectors()](#clearvectors)

Defined in: [api/facades/content-facade.ts:25](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/content-facade.ts#L25)

## Properties

### markers

> `readonly` **markers**: [`EntityCollection`](Class.EntityCollection.md)\<[`Marker`](Class.Marker.md)\>

Defined in: [api/facades/content-facade.ts:30](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/content-facade.ts#L30)

Marker collection for this map.

***

### vectors

> `readonly` **vectors**: [`EntityCollection`](Class.EntityCollection.md)\<[`Vector`](Class.Vector.md)\>

Defined in: [api/facades/content-facade.ts:32](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/content-facade.ts#L32)

Vector collection for this map.

## Methods

### addIcon()

> **addIcon**(`def`, `id?`): [`IconHandle`](Interface.IconHandle.md)

Defined in: [api/facades/content-facade.ts:64](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/content-facade.ts#L64)

Register an icon definition for use with markers.

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

Defined in: [api/facades/content-facade.ts:85](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/content-facade.ts#L85)

Create and add a marker.

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

### addVector()

> **addVector**(`geometry`, `opts?`): [`Vector`](Class.Vector.md)

Defined in: [api/facades/content-facade.ts:104](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/content-facade.ts#L104)

Create and add a vector shape.

#### Parameters

##### geometry

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

##### opts?

###### data?

`unknown`

#### Returns

[`Vector`](Class.Vector.md)

***

### clearMarkers()

> **clearMarkers**(): `void`

Defined in: [api/facades/content-facade.ts:95](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/content-facade.ts#L95)

Remove all markers.

#### Returns

`void`

***

### clearVectors()

> **clearVectors**(): `void`

Defined in: [api/facades/content-facade.ts:114](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/content-facade.ts#L114)

Remove all vectors.

#### Returns

`void`
