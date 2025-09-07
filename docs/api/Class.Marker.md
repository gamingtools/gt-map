[**@gaming.tools/gtmap**](README.md)

***

# Class: Marker

Defined in: [entities/Marker.ts:32](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Marker.ts#L32)

Marker - an icon anchored at a world pixel coordinate.

## Remarks

Emits typed events via [marker.events](#events) (`click`,
`pointerenter`, `pointerleave`, `positionchange`, `remove`, …).

## Extends

- `EventedEntity`\<[`MarkerEventMap`](Interface.MarkerEventMap.md)\>

## Properties

### events

> `readonly` **events**: [`MarkerEvents`](Interface.MarkerEvents.md)

Defined in: [entities/Marker.ts:168](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Marker.ts#L168)

Public events surface for this marker (typed event names/payloads).

#### Overrides

`EventedEntity.events`

***

### id

> `readonly` **id**: `string`

Defined in: [entities/Marker.ts:33](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Marker.ts#L33)

## Accessors

### data

#### Get Signature

> **get** **data**(): `unknown`

Defined in: [entities/Marker.ts:85](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Marker.ts#L85)

Arbitrary user data attached to the marker.

##### Returns

`unknown`

***

### iconType

#### Get Signature

> **get** **iconType**(): `string`

Defined in: [entities/Marker.ts:73](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Marker.ts#L73)

Icon id for this marker (or `'default'`).

##### Returns

`string`

***

### rotation

#### Get Signature

> **get** **rotation**(): `undefined` \| `number`

Defined in: [entities/Marker.ts:81](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Marker.ts#L81)

Optional clockwise rotation in degrees.

##### Returns

`undefined` \| `number`

***

### size

#### Get Signature

> **get** **size**(): `undefined` \| `number`

Defined in: [entities/Marker.ts:77](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Marker.ts#L77)

Optional scale multiplier (renderer treats `undefined` as 1).

##### Returns

`undefined` \| `number`

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [entities/Marker.ts:65](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Marker.ts#L65)

Get the current world X (pixels).

##### Returns

`number`

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [entities/Marker.ts:69](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Marker.ts#L69)

Get the current world Y (pixels).

##### Returns

`number`

## Methods

### moveTo()

> **moveTo**(`x`, `y`): `void`

Defined in: [entities/Marker.ts:129](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Marker.ts#L129)

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

Defined in: [entities/Marker.ts:145](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Marker.ts#L145)

Emit a `remove` event.

#### Returns

`void`

#### Remarks

The owning layer will clear it from the collection.

***

### setData()

> **setData**(`data`): `void`

Defined in: [entities/Marker.ts:99](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Marker.ts#L99)

Attach arbitrary user data to this marker and trigger a renderer sync.

#### Parameters

##### data

`unknown`

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

Defined in: [entities/Marker.ts:110](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Marker.ts#L110)

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

> **toData**(): [`MarkerData`](Interface.MarkerData.md)

Defined in: [entities/Marker.ts:154](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/entities/Marker.ts#L154)

Get a snapshot used in event payloads and renderer sync.

#### Returns

[`MarkerData`](Interface.MarkerData.md)
