[**@gaming.tools/gtmap**](README.md)

***

# Class: StaticLayer

[← Back to API index](./README.md)

## Contents

- [Constructors](#constructors)
  - [Constructor](#constructor)
- [Properties](#properties)
  - [id](#id)
  - [type](#type)
  - [vectors](#vectors)
- [Methods](#methods)
  - [addCircle()](#addcircle)
  - [addPolygon()](#addpolygon)
  - [addPolyline()](#addpolyline)
  - [addVector()](#addvector)
  - [clearVectors()](#clearvectors)

Defined in: [api/layers/static-layer.ts:12](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/static-layer.ts#L12)

## Constructors

### Constructor

> **new StaticLayer**(): `StaticLayer`

Defined in: [api/layers/static-layer.ts:30](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/static-layer.ts#L30)

#### Returns

`StaticLayer`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [api/layers/static-layer.ts:14](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/static-layer.ts#L14)

***

### type

> `readonly` **type**: `"static"`

Defined in: [api/layers/static-layer.ts:13](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/static-layer.ts#L13)

***

### vectors

> `readonly` **vectors**: [`EntityCollection`](Class.EntityCollection.md)\<[`Vector`](Class.Vector.md)\>

Defined in: [api/layers/static-layer.ts:17](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/static-layer.ts#L17)

Vector collection for this layer.

## Methods

### addCircle()

> **addCircle**(`center`, `radius`, `style?`, `opts?`): [`Vector`](Class.Vector.md)

Defined in: [api/layers/static-layer.ts:55](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/static-layer.ts#L55)

#### Parameters

##### center

[`Point`](TypeAlias.Point.md)

##### radius

`number`

##### style?

[`VectorStyle`](Interface.VectorStyle.md)

##### opts?

[`VectorOptions`](Interface.VectorOptions.md)

#### Returns

[`Vector`](Class.Vector.md)

***

### addPolygon()

> **addPolygon**(`points`, `style?`, `opts?`): [`Vector`](Class.Vector.md)

Defined in: [api/layers/static-layer.ts:45](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/static-layer.ts#L45)

#### Parameters

##### points

[`Point`](TypeAlias.Point.md)[]

##### style?

[`VectorStyle`](Interface.VectorStyle.md)

##### opts?

[`VectorOptions`](Interface.VectorOptions.md)

#### Returns

[`Vector`](Class.Vector.md)

***

### addPolyline()

> **addPolyline**(`points`, `style?`, `opts?`): [`Vector`](Class.Vector.md)

Defined in: [api/layers/static-layer.ts:50](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/static-layer.ts#L50)

#### Parameters

##### points

[`Point`](TypeAlias.Point.md)[]

##### style?

[`VectorStyle`](Interface.VectorStyle.md)

##### opts?

[`VectorOptions`](Interface.VectorOptions.md)

#### Returns

[`Vector`](Class.Vector.md)

***

### addVector()

> **addVector**(`geometry`, `opts?`): [`Vector`](Class.Vector.md)

Defined in: [api/layers/static-layer.ts:61](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/static-layer.ts#L61)

Generic add method for any vector geometry.

#### Parameters

##### geometry

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

##### opts?

[`VectorOptions`](Interface.VectorOptions.md)

#### Returns

[`Vector`](Class.Vector.md)

***

### clearVectors()

> **clearVectors**(): `void`

Defined in: [api/layers/static-layer.ts:65](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/layers/static-layer.ts#L65)

#### Returns

`void`
