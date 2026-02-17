[**@gaming.tools/gtmap**](README.md)

***

# Class: Marker

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Extends](#extends)
- [Properties](#properties)
  - [id](#id)
- [Accessors](#accessors)
  - [data](#data)
  - [events](#events)
  - [iconScaleFunction](#iconscalefunction)
  - [opacity](#opacity)
  - [rotation](#rotation)
  - [scale](#scale)
  - [visual](#visual)
  - [x](#x)
  - [y](#y)
- [Methods](#methods)
  - [moveTo()](#moveto)
  - [setData()](#setdata)
  - [setStyle()](#setstyle)
  - [toData()](#todata)
  - [transition()](#transition)

Defined in: [entities/marker.ts:57](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L57)

Marker - an interactive visual anchored at a world pixel coordinate.

## Remarks

Emits typed events via [marker.events](#events) (`click`,
`pointerenter`, `pointerleave`, `positionchange`, `remove`, ...).

## Extends

- `EventedEntity`\<[`MarkerEventMap`](Interface.MarkerEventMap.md)\>

## Properties

### id

> `readonly` **id**: `string`

Defined in: [entities/marker.ts:58](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L58)

## Accessors

### data

#### Get Signature

> **get** **data**(): `unknown`

Defined in: [entities/marker.ts:123](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L123)

Arbitrary user data attached to the marker.

##### Returns

`unknown`

***

### events

#### Get Signature

> **get** **events**(): [`PublicEvents`](Interface.PublicEvents.md)\<`EventMap`\>

Defined in: [entities/base.ts:7](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/base.ts#L7)

##### Returns

[`PublicEvents`](Interface.PublicEvents.md)\<`EventMap`\>

#### Inherited from

`EventedEntity.events`

***

### iconScaleFunction

#### Get Signature

> **get** **iconScaleFunction**(): `undefined` \| `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

Defined in: [entities/marker.ts:119](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L119)

Icon scale function override for this marker (undefined = use visual's or map's).

##### Returns

`undefined` \| `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [entities/marker.ts:115](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L115)

Opacity (0-1).

##### Returns

`number`

***

### rotation

#### Get Signature

> **get** **rotation**(): `number`

Defined in: [entities/marker.ts:111](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L111)

Clockwise rotation in degrees.

##### Returns

`number`

***

### scale

#### Get Signature

> **get** **scale**(): `number`

Defined in: [entities/marker.ts:107](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L107)

Scale multiplier (1 = visual's native size).

##### Returns

`number`

***

### visual

#### Get Signature

> **get** **visual**(): [`Visual`](Class.Visual.md)

Defined in: [entities/marker.ts:103](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L103)

The visual template for this marker.

##### Returns

[`Visual`](Class.Visual.md)

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [entities/marker.ts:95](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L95)

Get the current world X (pixels).

##### Returns

`number`

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [entities/marker.ts:99](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L99)

Get the current world Y (pixels).

##### Returns

`number`

## Methods

### moveTo()

> **moveTo**(`x`, `y`): `this`

Defined in: [entities/marker.ts:173](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L173)

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

Emits a `positionchange` event and re-syncs to the renderer.

#### Example

```ts
// Nudge marker 10px to the right
marker.moveTo(marker.x + 10, marker.y);
```

***

### setData()

> **setData**(`data`): `this`

Defined in: [entities/marker.ts:138](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L138)

Attach arbitrary user data to this marker and trigger a renderer sync.

#### Parameters

##### data

`unknown`

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

Defined in: [entities/marker.ts:151](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L151)

Update the marker style properties and trigger a renderer sync.

#### Parameters

##### opts

Partial style options

###### opacity?

`number`

###### rotation?

`number`

###### scale?

`number`

###### visual?

[`Visual`](Class.Visual.md)

#### Returns

`this`

This marker for chaining

***

### toData()

> **toData**(): [`MarkerData`](Interface.MarkerData.md)

Defined in: [entities/marker.ts:196](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L196)

Get a snapshot used in event payloads and renderer sync.

#### Returns

[`MarkerData`](Interface.MarkerData.md)

***

### transition()

> **transition**(): [`MarkerTransition`](Interface.MarkerTransition.md)

Defined in: [entities/marker.ts:212](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L212)

Start a marker transition (position/rotation/scale/opacity).

#### Returns

[`MarkerTransition`](Interface.MarkerTransition.md)
