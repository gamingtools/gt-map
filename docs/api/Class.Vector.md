[**@gaming.tools/gtmap**](README.md)

***

# Class: Vector

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Extends](#extends)
- [Properties](#properties)
  - [id](#id)
- [Accessors](#accessors)
  - [events](#events)
  - [geometry](#geometry)
- [Methods](#methods)
  - [setGeometry()](#setgeometry)
  - [toData()](#todata)

Defined in: [entities/vector.ts:32](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/vector.ts#L32)

Vector - a simple geometric overlay (polyline, polygon, or circle).

## Remarks

Events are minimal for now (`remove`); interaction events can be added later.

## Extends

- `EventedEntity`\<[`VectorEventMap`](Interface.VectorEventMap.md)\>

## Properties

### id

> `readonly` **id**: `string`

Defined in: [entities/vector.ts:33](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/vector.ts#L33)

## Accessors

### events

#### Get Signature

> **get** **events**(): [`PublicEvents`](Interface.PublicEvents.md)\<`EventMap`\>

Defined in: [entities/base.ts:7](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/base.ts#L7)

##### Returns

[`PublicEvents`](Interface.PublicEvents.md)\<`EventMap`\>

#### Inherited from

`EventedEntity.events`

***

### geometry

#### Get Signature

> **get** **geometry**(): [`VectorGeometry`](TypeAlias.VectorGeometry.md)

Defined in: [entities/vector.ts:54](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/vector.ts#L54)

Get current geometry.

##### Returns

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

## Methods

### setGeometry()

> **setGeometry**(`geometry`): `this`

Defined in: [entities/vector.ts:69](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/vector.ts#L69)

Replace the vector geometry and trigger a renderer sync.

#### Parameters

##### geometry

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

#### Returns

`this`

This vector for chaining

#### Example

```ts
// Turn a polygon into a polyline with two points
v.setGeometry({ type: 'polyline', points: [ { x: 0, y: 0 }, { x: 100, y: 50 } ] });
```

***

### toData()

> **toData**(): [`VectorData`](Interface.VectorData.md)

Defined in: [entities/vector.ts:80](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/vector.ts#L80)

Get a snapshot used in event payloads.

#### Returns

[`VectorData`](Interface.VectorData.md)
