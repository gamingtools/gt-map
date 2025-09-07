[**@gaming.tools/gtmap**](README.md)

***

# Class: VectorEntity

Defined in: [entities/Vector.ts:33](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Vector.ts#L33)

Vector - a simple geometric overlay (polyline, polygon, or circle).

## Remarks

Events are minimal for now (`remove`); interaction events can be added later.

## Extends

- `EventedEntity`\<[`VectorEventMap`](Interface.VectorEventMap.md)\>

## Properties

### events

> `readonly` **events**: [`VectorEvents`](Interface.VectorEvents.md)

Defined in: [entities/Vector.ts:84](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Vector.ts#L84)

Public events surface for this vector.

#### Overrides

`EventedEntity.events`

***

### id

> `readonly` **id**: `string`

Defined in: [entities/Vector.ts:34](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Vector.ts#L34)

## Accessors

### geometry

#### Get Signature

> **get** **geometry**(): [`VectorGeometry`](TypeAlias.VectorGeometry.md)

Defined in: [entities/Vector.ts:55](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Vector.ts#L55)

Get current geometry.

##### Returns

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

## Methods

### remove()

> **remove**(): `void`

Defined in: [entities/Vector.ts:79](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Vector.ts#L79)

Emit a `remove` event (the owning layer clears it from the collection).

#### Returns

`void`

***

### setGeometry()

> **setGeometry**(`geometry`): `void`

Defined in: [entities/Vector.ts:69](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Vector.ts#L69)

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
