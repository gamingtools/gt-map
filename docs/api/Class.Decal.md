[**@gaming.tools/gtmap**](README.md)

***

# Class: Decal

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Extends](#extends)
- [Properties](#properties)
  - [id](#id)
- [Accessors](#accessors)
  - [events](#events)
  - [iconScaleFunction](#iconscalefunction)
  - [opacity](#opacity)
  - [rotation](#rotation)
  - [scale](#scale)
  - [visual](#visual)
  - [x](#x)
  - [y](#y)
  - [zIndex](#zindex)
- [Methods](#methods)
  - [moveTo()](#moveto)
  - [setStyle()](#setstyle)
  - [toData()](#todata)

Defined in: [entities/decal.ts:50](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/entities/decal.ts#L50)

Decal - a non-interactive visual anchored at a world pixel coordinate.

## Remarks

Decals are like markers but without interactivity (no click/hover events).
Use for decorations, labels, effects, or other non-clickable visuals.
Emits `positionchange` and `remove` events.

## Extends

- `EventedEntity`\<[`DecalEventMap`](Interface.DecalEventMap.md)\>

## Properties

### id

> `readonly` **id**: `string`

Defined in: [entities/decal.ts:51](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/entities/decal.ts#L51)

## Accessors

### events

#### Get Signature

> **get** **events**(): [`PublicEvents`](Interface.PublicEvents.md)\<`EventMap`\>

Defined in: [entities/base.ts:7](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/entities/base.ts#L7)

##### Returns

[`PublicEvents`](Interface.PublicEvents.md)\<`EventMap`\>

#### Inherited from

`EventedEntity.events`

***

### iconScaleFunction

#### Get Signature

> **get** **iconScaleFunction**(): `undefined` \| `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

Defined in: [entities/decal.ts:121](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/entities/decal.ts#L121)

Icon scale function override for this decal (undefined = use visual's or map's).

##### Returns

`undefined` \| `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [entities/decal.ts:111](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/entities/decal.ts#L111)

Opacity (0-1).

##### Returns

`number`

***

### rotation

#### Get Signature

> **get** **rotation**(): `number`

Defined in: [entities/decal.ts:106](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/entities/decal.ts#L106)

Clockwise rotation in degrees.

##### Returns

`number`

***

### scale

#### Get Signature

> **get** **scale**(): `number`

Defined in: [entities/decal.ts:101](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/entities/decal.ts#L101)

Scale multiplier (1 = visual's native size).

##### Returns

`number`

***

### visual

#### Get Signature

> **get** **visual**(): [`Visual`](Class.Visual.md)

Defined in: [entities/decal.ts:96](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/entities/decal.ts#L96)

The visual template for this decal.

##### Returns

[`Visual`](Class.Visual.md)

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [entities/decal.ts:86](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/entities/decal.ts#L86)

Get the current world X (pixels).

##### Returns

`number`

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [entities/decal.ts:91](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/entities/decal.ts#L91)

Get the current world Y (pixels).

##### Returns

`number`

***

### zIndex

#### Get Signature

> **get** **zIndex**(): `number`

Defined in: [entities/decal.ts:116](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/entities/decal.ts#L116)

Z-index for stacking order (higher values render on top).

##### Returns

`number`

## Methods

### moveTo()

> **moveTo**(`x`, `y`): `this`

Defined in: [entities/decal.ts:150](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/entities/decal.ts#L150)

Move the decal to a new position.

#### Parameters

##### x

`number`

New world X

##### y

`number`

New world Y

#### Returns

`this`

This decal for chaining

***

### setStyle()

> **setStyle**(`opts`): `this`

Defined in: [entities/decal.ts:132](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/entities/decal.ts#L132)

Update the decal style properties.

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

###### zIndex?

`number`

#### Returns

`this`

This decal for chaining

***

### toData()

> **toData**(): [`DecalData`](Interface.DecalData.md)

Defined in: [entities/decal.ts:173](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/entities/decal.ts#L173)

Get a snapshot for event payloads.

#### Returns

[`DecalData`](Interface.DecalData.md)
