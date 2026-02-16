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
  - [data](#data)
  - [events](#events)
  - [geometry](#geometry)
- [Methods](#methods)
  - [setData()](#setdata)
  - [setGeometry()](#setgeometry)
  - [toData()](#todata)

Defined in: [entities/vector.ts:33](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/vector.ts#L33)

Vector - a simple geometric overlay (polyline, polygon, or circle).

## Remarks

Events are minimal for now (`remove`); interaction events can be added later.

## Extends

- `EventedEntity`\<[`VectorEventMap`](Interface.VectorEventMap.md)\>

## Properties

### id

> `readonly` **id**: `string`

Defined in: [entities/vector.ts:34](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/vector.ts#L34)

## Accessors

### data

#### Get Signature

> **get** **data**(): `unknown`

Defined in: [entities/vector.ts:62](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/vector.ts#L62)

Get user data attached to this vector.

##### Returns

`unknown`

***

### events

#### Get Signature

> **get** **events**(): [`PublicEvents`](Interface.PublicEvents.md)\<`EventMap`\>

Defined in: [entities/base.ts:7](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/base.ts#L7)

##### Returns

[`PublicEvents`](Interface.PublicEvents.md)\<`EventMap`\>

#### Inherited from

`EventedEntity.events`

***

### geometry

#### Get Signature

> **get** **geometry**(): [`VectorGeometry`](TypeAlias.VectorGeometry.md)

Defined in: [entities/vector.ts:57](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/vector.ts#L57)

Get current geometry.

##### Returns

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

## Methods

### setData()

> **setData**(`data`): `this`

Defined in: [entities/vector.ts:94](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/vector.ts#L94)

Update user data attached to this vector.

#### Parameters

##### data

`unknown`

Arbitrary user data

#### Returns

`this`

This vector for chaining

#### Example

```ts
vector.setData({ region: 'north', level: 5 });
```

***

### setGeometry()

> **setGeometry**(`geometry`): `this`

Defined in: [entities/vector.ts:77](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/vector.ts#L77)

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

Defined in: [entities/vector.ts:104](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/entities/vector.ts#L104)

Get a snapshot used in event payloads.

#### Returns

[`VectorData`](Interface.VectorData.md)
