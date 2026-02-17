[**@gaming.tools/gtmap**](README.md)

***

# Class: StaticLayer

Defined in: [api/layers/static-layer.ts:20](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/static-layer.ts#L20)

A layer that owns vector shapes (polylines, polygons, circles).

## Remarks

Create via `map.layers.createStaticLayer()`, then attach
with `map.layers.addLayer(layer, { z })`.

## Constructors

### Constructor

> **new StaticLayer**(): `StaticLayer`

Defined in: [api/layers/static-layer.ts:38](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/static-layer.ts#L38)

#### Returns

`StaticLayer`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [api/layers/static-layer.ts:22](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/static-layer.ts#L22)

***

### type

> `readonly` **type**: `"static"`

Defined in: [api/layers/static-layer.ts:21](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/static-layer.ts#L21)

***

### vectors

> `readonly` **vectors**: [`EntityCollection`](Class.EntityCollection.md)\<[`Vector`](Class.Vector.md)\>

Defined in: [api/layers/static-layer.ts:25](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/static-layer.ts#L25)

Vector collection for this layer.

## Methods

### addCircle()

> **addCircle**(`center`, `radius`, `style?`, `opts?`): [`Vector`](Class.Vector.md)

Defined in: [api/layers/static-layer.ts:66](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/static-layer.ts#L66)

Add a circle from a center point and radius.

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

Defined in: [api/layers/static-layer.ts:54](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/static-layer.ts#L54)

Add a filled polygon from an array of points.

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

Defined in: [api/layers/static-layer.ts:60](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/static-layer.ts#L60)

Add a polyline (open path) from an array of points.

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

Defined in: [api/layers/static-layer.ts:72](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/static-layer.ts#L72)

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

Defined in: [api/layers/static-layer.ts:77](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/layers/static-layer.ts#L77)

Remove all vectors from this layer.

#### Returns

`void`
