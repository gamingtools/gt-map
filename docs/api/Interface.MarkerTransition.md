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

Defined in: [entities/Marker.ts:20](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/entities/Marker.ts#L20)

Builder for animating a single Marker (position/rotation/size).

## Methods

### apply()

> **apply**(`opts?`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [entities/Marker.ts:26](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/entities/Marker.ts#L26)

Commit the transition (instant or animated).

#### Parameters

##### opts?

[`ApplyOptions`](Interface.ApplyOptions.md)

#### Returns

`Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

***

### cancel()

> **cancel**(): `void`

Defined in: [entities/Marker.ts:28](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/entities/Marker.ts#L28)

Cancel a pending or running transition.

#### Returns

`void`

***

### moveTo()

> **moveTo**(`x`, `y`): `this`

Defined in: [entities/Marker.ts:22](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/entities/Marker.ts#L22)

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

Defined in: [entities/Marker.ts:24](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/entities/Marker.ts#L24)

Target style properties (size, rotation).

#### Parameters

##### opts

###### rotation?

`number`

###### size?

`number`

#### Returns

`this`
