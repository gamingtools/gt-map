[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerTransition

Defined in: [entities/marker.ts:38](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L38)

Builder for animating a single Marker (position/rotation/scale).

## Methods

### apply()

> **apply**(`opts?`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [entities/marker.ts:44](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L44)

Commit the transition (instant or animated).

#### Parameters

##### opts?

[`ApplyOptions`](Interface.ApplyOptions.md)

#### Returns

`Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

***

### cancel()

> **cancel**(): `void`

Defined in: [entities/marker.ts:46](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L46)

Cancel a pending or running transition.

#### Returns

`void`

***

### moveTo()

> **moveTo**(`x`, `y`): `this`

Defined in: [entities/marker.ts:40](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L40)

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

Defined in: [entities/marker.ts:42](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L42)

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
