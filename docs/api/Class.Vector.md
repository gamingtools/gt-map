[**@gaming.tools/gtmap**](README.md)

***

# Class: Vector

Defined in: [entities/Vector.ts:35](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/entities/Vector.ts#L35)

Vector - a simple geometric overlay (polyline, polygon, or circle).

## Remarks

Events are minimal for now (`remove`); interaction events can be added later.

## Extends

- `EventedEntity`\<`VectorEventMap`\>

## Properties

### events

> `readonly` **events**: [`VectorEvents`](Interface.VectorEvents.md)

Defined in: [entities/Vector.ts:86](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/entities/Vector.ts#L86)

Public events surface for this vector.

#### Overrides

`EventedEntity.events`

***

### id

> `readonly` **id**: `string`

Defined in: [entities/Vector.ts:36](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/entities/Vector.ts#L36)

## Accessors

### geometry

#### Get Signature

> **get** **geometry**(): `VectorGeometry`

Defined in: [entities/Vector.ts:57](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/entities/Vector.ts#L57)

Get current geometry.

##### Returns

`VectorGeometry`

## Methods

### remove()

> **remove**(): `void`

Defined in: [entities/Vector.ts:81](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/entities/Vector.ts#L81)

Emit a `remove` event (the owning layer clears it from the collection).

#### Returns

`void`

***

### setGeometry()

> **setGeometry**(`geometry`): `void`

Defined in: [entities/Vector.ts:71](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/entities/Vector.ts#L71)

Replace the vector geometry and trigger a renderer sync.

#### Parameters

##### geometry

`VectorGeometry`

#### Returns

`void`

#### Example

```ts
// Turn a polygon into a polyline with two points
v.setGeometry({ type: 'polyline', points: [ { x: 0, y: 0 }, { x: 100, y: 50 } ] });
```
