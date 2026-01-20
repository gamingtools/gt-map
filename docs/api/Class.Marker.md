[**@gaming.tools/gtmap**](README.md)

***

# Class: Marker\<T\>

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Extends](#extends)
- [Type Parameters](#type-parameters)
  - [T](#t)
- [Properties](#properties)
  - [id](#id)
- [Accessors](#accessors)
  - [data](#data)
  - [events](#events)
  - [iconType](#icontype)
  - [rotation](#rotation)
  - [size](#size)
  - [x](#x)
  - [y](#y)
- [Methods](#methods)
  - [moveTo()](#moveto)
  - [setData()](#setdata)
  - [setStyle()](#setstyle)
  - [toData()](#todata)
  - [transition()](#transition)

Defined in: [entities/marker.ts:44](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/marker.ts#L44)

Marker - an icon anchored at a world pixel coordinate.

## Remarks

Emits typed events via [marker.events](#events) (`click`,
`pointerenter`, `pointerleave`, `positionchange`, `remove`, …).

## Extends

- `EventedEntity`\<[`MarkerEventMap`](Interface.MarkerEventMap.md)\<`T`\>\>

## Type Parameters

### T

`T` = `unknown`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [entities/marker.ts:45](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/marker.ts#L45)

## Accessors

### data

#### Get Signature

> **get** **data**(): `undefined` \| `T`

Defined in: [entities/marker.ts:98](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/marker.ts#L98)

Arbitrary user data attached to the marker.

##### Returns

`undefined` \| `T`

***

### events

#### Get Signature

> **get** **events**(): [`PublicEvents`](Interface.PublicEvents.md)\<`EventMap`\>

Defined in: [entities/base.ts:7](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/base.ts#L7)

##### Returns

[`PublicEvents`](Interface.PublicEvents.md)\<`EventMap`\>

#### Inherited from

`EventedEntity.events`

***

### iconType

#### Get Signature

> **get** **iconType**(): `string`

Defined in: [entities/marker.ts:86](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/marker.ts#L86)

Icon id for this marker (or `'default'`).

##### Returns

`string`

***

### rotation

#### Get Signature

> **get** **rotation**(): `undefined` \| `number`

Defined in: [entities/marker.ts:94](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/marker.ts#L94)

Optional clockwise rotation in degrees.

##### Returns

`undefined` \| `number`

***

### size

#### Get Signature

> **get** **size**(): `undefined` \| `number`

Defined in: [entities/marker.ts:90](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/marker.ts#L90)

Optional scale multiplier (renderer treats `undefined` as 1).

##### Returns

`undefined` \| `number`

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [entities/marker.ts:78](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/marker.ts#L78)

Get the current world X (pixels).

##### Returns

`number`

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [entities/marker.ts:82](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/marker.ts#L82)

Get the current world Y (pixels).

##### Returns

`number`

## Methods

### moveTo()

> **moveTo**(`x`, `y`): `this`

Defined in: [entities/marker.ts:147](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/marker.ts#L147)

Move the marker to a new position and emit a `positionchange` event.

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`this`

This marker for chaining

#### Remarks

Emits a `positionchange` event and re‑syncs to the renderer.

#### Example

```ts
// Nudge marker 10px to the right
marker.moveTo(marker.x + 10, marker.y);
```

***

### setData()

> **setData**(`data`): `this`

Defined in: [entities/marker.ts:113](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/marker.ts#L113)

Attach arbitrary user data to this marker and trigger a renderer sync.

#### Parameters

##### data

`T`

#### Returns

`this`

This marker for chaining

#### Example

```ts
// Tag this marker with a POI payload used elsewhere in the app
marker.setData({ id: 'poi-1', category: 'shop' });
```

***

### setStyle()

> **setStyle**(`opts`): `this`

Defined in: [entities/marker.ts:126](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/marker.ts#L126)

Update the marker style properties and trigger a renderer sync.

#### Parameters

##### opts

Partial style ([MarkerOptions](Interface.MarkerOptions.md))

###### iconType?

`string`

###### rotation?

`number`

###### size?

`number`

#### Returns

`this`

This marker for chaining

***

### toData()

> **toData**(): [`MarkerData`](Interface.MarkerData.md)\<`T`\>

Defined in: [entities/marker.ts:170](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/marker.ts#L170)

Get a snapshot used in event payloads and renderer sync.

#### Returns

[`MarkerData`](Interface.MarkerData.md)\<`T`\>

***

### transition()

> **transition**(): [`MarkerTransition`](Interface.MarkerTransition.md)

Defined in: [entities/marker.ts:186](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/marker.ts#L186)

Start a marker transition (position/rotation/size).

#### Returns

[`MarkerTransition`](Interface.MarkerTransition.md)
