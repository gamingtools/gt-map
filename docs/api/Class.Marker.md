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
  - [events](#events)
  - [id](#id)
- [Accessors](#accessors)
  - [data](#data)
  - [iconType](#icontype)
  - [rotation](#rotation)
  - [size](#size)
  - [x](#x)
  - [y](#y)
- [Methods](#methods)
  - [moveTo()](#moveto)
  - [remove()](#remove)
  - [setData()](#setdata)
  - [setStyle()](#setstyle)
  - [toData()](#todata)

Defined in: entities/marker.ts:32

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

### events

> `readonly` **events**: [`MarkerEvents`](Interface.MarkerEvents.md)\<`T`\>

Defined in: entities/marker.ts:168

Public events surface for this marker (typed event names/payloads).

#### Overrides

`EventedEntity.events`

***

### id

> `readonly` **id**: `string`

Defined in: entities/marker.ts:33

## Accessors

### data

#### Get Signature

> **get** **data**(): `undefined` \| `T`

Defined in: entities/marker.ts:85

Arbitrary user data attached to the marker.

##### Returns

`undefined` \| `T`

***

### iconType

#### Get Signature

> **get** **iconType**(): `string`

Defined in: entities/marker.ts:73

Icon id for this marker (or `'default'`).

##### Returns

`string`

***

### rotation

#### Get Signature

> **get** **rotation**(): `undefined` \| `number`

Defined in: entities/marker.ts:81

Optional clockwise rotation in degrees.

##### Returns

`undefined` \| `number`

***

### size

#### Get Signature

> **get** **size**(): `undefined` \| `number`

Defined in: entities/marker.ts:77

Optional scale multiplier (renderer treats `undefined` as 1).

##### Returns

`undefined` \| `number`

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: entities/marker.ts:65

Get the current world X (pixels).

##### Returns

`number`

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: entities/marker.ts:69

Get the current world Y (pixels).

##### Returns

`number`

## Methods

### moveTo()

> **moveTo**(`x`, `y`): `void`

Defined in: entities/marker.ts:129

Move the marker to a new world pixel coordinate.

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`void`

#### Remarks

Emits a `positionchange` event and re‑syncs to the renderer.

#### Example

```ts
// Nudge marker 10px to the right
marker.moveTo(marker.x + 10, marker.y);
```

***

### remove()

> **remove**(): `void`

Defined in: entities/marker.ts:145

Emit a `remove` event.

#### Returns

`void`

#### Remarks

The owning layer will clear it from the collection.

***

### setData()

> **setData**(`data`): `void`

Defined in: entities/marker.ts:99

Attach arbitrary user data to this marker and trigger a renderer sync.

#### Parameters

##### data

`T`

#### Returns

`void`

#### Example

```ts
// Tag this marker with a POI payload used elsewhere in the app
marker.setData({ id: 'poi-1', category: 'shop' });
```

***

### setStyle()

> **setStyle**(`opts`): `void`

Defined in: entities/marker.ts:110

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

`void`

***

### toData()

> **toData**(): [`MarkerData`](Interface.MarkerData.md)\<`T`\>

Defined in: entities/marker.ts:154

Get a snapshot used in event payloads and renderer sync.

#### Returns

[`MarkerData`](Interface.MarkerData.md)\<`T`\>
