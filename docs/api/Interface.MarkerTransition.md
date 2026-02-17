[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerTransition

Defined in: [entities/marker.ts:32](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/entities/marker.ts#L32)

Builder for animating a single Marker (position/rotation/scale).

## Methods

### apply()

> **apply**(`opts?`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [entities/marker.ts:38](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/entities/marker.ts#L38)

Commit the transition (instant or animated).

#### Parameters

##### opts?

[`ApplyOptions`](Interface.ApplyOptions.md)

#### Returns

`Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

***

### cancel()

> **cancel**(): `void`

Defined in: [entities/marker.ts:40](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/entities/marker.ts#L40)

Cancel a pending or running transition.

#### Returns

`void`

***

### moveTo()

> **moveTo**(`x`, `y`): `this`

Defined in: [entities/marker.ts:34](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/entities/marker.ts#L34)

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

Defined in: [entities/marker.ts:36](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/entities/marker.ts#L36)

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
