[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerTransition

[← Back to API index](./README.md)

## Contents

- [Methods](#methods)
  - [apply()](#apply)
  - [cancel()](#cancel)
  - [moveTo()](#moveto)
  - [setStyle()](#setstyle)

Defined in: [entities/marker.ts:32](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L32)

Builder for animating a single Marker (position/rotation/scale).

## Methods

### apply()

> **apply**(`opts?`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [entities/marker.ts:38](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L38)

Commit the transition (instant or animated).

#### Parameters

##### opts?

[`ApplyOptions`](Interface.ApplyOptions.md)

#### Returns

`Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

***

### cancel()

> **cancel**(): `void`

Defined in: [entities/marker.ts:40](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L40)

Cancel a pending or running transition.

#### Returns

`void`

***

### moveTo()

> **moveTo**(`x`, `y`): `this`

Defined in: [entities/marker.ts:34](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L34)

Target a new position in world pixels.

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`this`

***

### setStyle()

> **setStyle**(`opts`): `this`

Defined in: [entities/marker.ts:36](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/marker.ts#L36)

Target style properties (scale, rotation, opacity).

#### Parameters

##### opts

###### opacity?

`number`

###### rotation?

`number`

###### scale?

`number`

#### Returns

`this`
