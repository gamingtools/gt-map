[**@gaming.tools/gtmap**](README.md)

***

# Class: Marker\<T\>

Defined in: [entities/marker.ts:63](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L63)

Marker - an interactive visual anchored at a world pixel coordinate.

## Remarks

Emits typed events via [marker.events](#events) (`click`,
`pointerenter`, `pointerleave`, `positionchange`, `remove`, ...).

## Extends

- `EventedEntity`\<[`MarkerEventMap`](Interface.MarkerEventMap.md)\<`T`\>\>

## Type Parameters

### T

`T` = `unknown`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [entities/marker.ts:64](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L64)

## Accessors

### data

#### Get Signature

> **get** **data**(): `undefined` \| `T`

Defined in: [entities/marker.ts:135](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L135)

Arbitrary user data attached to the marker.

##### Returns

`undefined` \| `T`

***

### events

#### Get Signature

> **get** **events**(): [`PublicEvents`](Interface.PublicEvents.md)\<`EventMap`\>

Defined in: [entities/base.ts:7](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/base.ts#L7)

##### Returns

[`PublicEvents`](Interface.PublicEvents.md)\<`EventMap`\>

#### Inherited from

`EventedEntity.events`

***

### iconScaleFunction

#### Get Signature

> **get** **iconScaleFunction**(): `undefined` \| `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

Defined in: [entities/marker.ts:131](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L131)

Icon scale function override for this marker (undefined = use visual's or map's).

##### Returns

`undefined` \| `null` \| [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [entities/marker.ts:123](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L123)

Opacity (0-1).

##### Returns

`number`

***

### rotation

#### Get Signature

> **get** **rotation**(): `number`

Defined in: [entities/marker.ts:119](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L119)

Clockwise rotation in degrees.

##### Returns

`number`

***

### scale

#### Get Signature

> **get** **scale**(): `number`

Defined in: [entities/marker.ts:115](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L115)

Scale multiplier (1 = visual's native size).

##### Returns

`number`

***

### visual

#### Get Signature

> **get** **visual**(): [`Visual`](Class.Visual.md)

Defined in: [entities/marker.ts:111](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L111)

The visual template for this marker.

##### Returns

[`Visual`](Class.Visual.md)

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [entities/marker.ts:103](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L103)

Get the current world X (pixels).

##### Returns

`number`

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [entities/marker.ts:107](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L107)

Get the current world Y (pixels).

##### Returns

`number`

***

### zIndex

#### Get Signature

> **get** **zIndex**(): `number`

Defined in: [entities/marker.ts:127](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L127)

Z-index for stacking order (higher values render on top).

##### Returns

`number`

## Methods

### moveTo()

> **moveTo**(`x`, `y`): `this`

Defined in: [entities/marker.ts:186](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L186)

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

Defined in: [entities/marker.ts:150](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L150)

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

Defined in: [entities/marker.ts:163](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L163)

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

###### zIndex?

`number`

#### Returns

`this`

This marker for chaining

***

### toData()

> **toData**(): [`MarkerData`](Interface.MarkerData.md)\<`T`\>

Defined in: [entities/marker.ts:209](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L209)

Get a snapshot used in event payloads and renderer sync.

#### Returns

[`MarkerData`](Interface.MarkerData.md)\<`T`\>

***

### transition()

> **transition**(): [`MarkerTransition`](Interface.MarkerTransition.md)

Defined in: [entities/marker.ts:225](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/marker.ts#L225)

Start a marker transition (position/rotation/scale/opacity).

#### Returns

[`MarkerTransition`](Interface.MarkerTransition.md)
