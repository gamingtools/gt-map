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

Defined in: [entities/marker.ts:19](https://github.com/gamingtools/gt-map/blob/83eed0a31c8285593128578c674ef7d7858d10a3/packages/gtmap/src/entities/marker.ts#L19)

Builder for animating a single Marker (position/rotation/size).

## Methods

### apply()

> **apply**(`opts?`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [entities/marker.ts:25](https://github.com/gamingtools/gt-map/blob/83eed0a31c8285593128578c674ef7d7858d10a3/packages/gtmap/src/entities/marker.ts#L25)

Commit the transition (instant or animated).

#### Parameters

##### opts?

[`ApplyOptions`](Interface.ApplyOptions.md)

#### Returns

`Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

***

### cancel()

> **cancel**(): `void`

Defined in: [entities/marker.ts:27](https://github.com/gamingtools/gt-map/blob/83eed0a31c8285593128578c674ef7d7858d10a3/packages/gtmap/src/entities/marker.ts#L27)

Cancel a pending or running transition.

#### Returns

`void`

***

### moveTo()

> **moveTo**(`x`, `y`): `this`

Defined in: [entities/marker.ts:21](https://github.com/gamingtools/gt-map/blob/83eed0a31c8285593128578c674ef7d7858d10a3/packages/gtmap/src/entities/marker.ts#L21)

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

Defined in: [entities/marker.ts:23](https://github.com/gamingtools/gt-map/blob/83eed0a31c8285593128578c674ef7d7858d10a3/packages/gtmap/src/entities/marker.ts#L23)

Target style properties (size, rotation).

#### Parameters

##### opts

###### rotation?

`number`

###### size?

`number`

#### Returns

`this`
