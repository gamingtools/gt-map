[**@gaming.tools/gtmap**](README.md)

***

# Class: VectorEntity

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Extends](#extends)
- [Properties](#properties)
  - [events](#events)
  - [id](#id)
- [Accessors](#accessors)
  - [geometry](#geometry)
- [Methods](#methods)
  - [remove()](#remove)
  - [setGeometry()](#setgeometry)

Defined in: entities/vector.ts:33

Vector - a simple geometric overlay (polyline, polygon, or circle).

## Remarks

Events are minimal for now (`remove`); interaction events can be added later.

## Extends

- `EventedEntity`\<[`VectorEventMap`](Interface.VectorEventMap.md)\>

## Properties

### events

> `readonly` **events**: [`VectorEvents`](Interface.VectorEvents.md)

Defined in: entities/vector.ts:84

Public events surface for this vector.

#### Overrides

`EventedEntity.events`

***

### id

> `readonly` **id**: `string`

Defined in: entities/vector.ts:34

## Accessors

### geometry

#### Get Signature

> **get** **geometry**(): [`VectorGeometry`](TypeAlias.VectorGeometry.md)

Defined in: entities/vector.ts:55

Get current geometry.

##### Returns

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

## Methods

### remove()

> **remove**(): `void`

Defined in: entities/vector.ts:79

Emit a `remove` event (the owning layer clears it from the collection).

#### Returns

`void`

***

### setGeometry()

> **setGeometry**(`geometry`): `void`

Defined in: entities/vector.ts:69

Replace the vector geometry and trigger a renderer sync.

#### Parameters

##### geometry

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

#### Returns

`void`

#### Example

```ts
// Turn a polygon into a polyline with two points
v.setGeometry({ type: 'polyline', points: [ { x: 0, y: 0 }, { x: 100, y: 50 } ] });
```
