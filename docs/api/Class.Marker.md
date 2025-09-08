[**@gaming.tools/gtmap**](README.md)

***

# Class: Marker\<T\>

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Example](#example)
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
  - [transition()](#transition)
  - [~~transitions()~~](#transitions)

Defined in: [entities/Marker.ts:140](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L140)

Marker - an icon anchored at a world pixel coordinate.

## Remarks

Markers are created via [GTMap.addMarker](Class.GTMap.md#addmarker) and managed through
the [Layer](Class.Layer.md) collection. Each marker has a unique ID, position,
icon type, and optional style properties.

Events are emitted via [marker.events](#events):
- `click` - User clicked the marker
- `pointerenter` - Pointer entered marker bounds
- `pointerleave` - Pointer left marker bounds
- `positionchange` - Marker moved to new position
- `remove` - Marker was removed

## Example

```ts
// Create marker with custom data
const marker = map.addMarker(1000, 1000, {
  iconType: 'poi',
  size: 1.2,
  rotation: 45,
  data: { id: 'location-1', name: 'Town Center' }
});

// Listen for events
marker.events.on('click').each(e => {
  console.log('Clicked:', e.marker.data);
});

// Animate to new position
await marker.transition()
  .moveTo(2000, 1500)
  .apply({ animate: { durationMs: 600 } });
```

## Extends

- `EventedEntity`\<[`MarkerEventMap`](Interface.MarkerEventMap.md)\<`T`\>\>

## Type Parameters

### T

`T` = `unknown`

Type of custom data attached to the marker

## Properties

### events

> `readonly` **events**: [`MarkerEvents`](Interface.MarkerEvents.md)\<`T`\>

Defined in: [entities/Marker.ts:384](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L384)

Public events surface for this marker.

#### Remarks

Provides typed event subscriptions for marker interactions.

#### Example

```ts
// Subscribe to click events
marker.events.on('click').each(e => {
  console.log('Clicked at:', e.screen);
});

// Wait for pointer enter
await marker.events.once('pointerenter');
```

#### Overrides

`EventedEntity.events`

***

### id

> `readonly` **id**: `string`

Defined in: [entities/Marker.ts:141](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L141)

## Accessors

### data

#### Get Signature

> **get** **data**(): `undefined` \| `T`

Defined in: [entities/Marker.ts:222](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L222)

Custom user data attached to the marker.

##### Remarks

Use [Marker.setData](#setdata) to update.

##### Returns

`undefined` \| `T`

***

### iconType

#### Get Signature

> **get** **iconType**(): `string`

Defined in: [entities/Marker.ts:194](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L194)

Icon type identifier for this marker.

##### Default Value

`'default'`

##### Returns

`string`

***

### rotation

#### Get Signature

> **get** **rotation**(): `undefined` \| `number`

Defined in: [entities/Marker.ts:212](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L212)

Clockwise rotation in degrees.

##### Returns

`undefined` \| `number`

***

### size

#### Get Signature

> **get** **size**(): `undefined` \| `number`

Defined in: [entities/Marker.ts:204](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L204)

Scale multiplier for the icon.

##### Remarks

Renderer treats `undefined` as `1`.

##### Returns

`undefined` \| `number`

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [entities/Marker.ts:177](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L177)

Get the current world X coordinate in pixels.

##### Returns

`number`

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [entities/Marker.ts:185](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L185)

Get the current world Y coordinate in pixels.

##### Returns

`number`

## Methods

### moveTo()

> **moveTo**(`x`, `y`): `void`

Defined in: [entities/Marker.ts:305](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L305)

Move the marker to a new world pixel coordinate.

#### Parameters

##### x

`number`

New X coordinate in world pixels

##### y

`number`

New Y coordinate in world pixels

#### Returns

`void`

#### Remarks

This is an instant move. For animated movement, use [Marker.transition](#transition).
Emits a `positionchange` event with position delta and triggers renderer sync.

#### Example

```ts
// Move to absolute position
marker.moveTo(2000, 1500);

// Nudge marker 10px to the right
marker.moveTo(marker.x + 10, marker.y);

// Follow mouse position (world coords)
map.events.on('pointermove').each(e => {
  if (e.world) marker.moveTo(e.world.x, e.world.y);
});
```

***

### remove()

> **remove**(): `void`

Defined in: [entities/Marker.ts:334](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L334)

Remove this marker from the map.

#### Returns

`void`

#### Remarks

Emits a `remove` event. The owning [Layer](Class.Layer.md) will clear it
from the collection and trigger a renderer sync.

#### Example

```ts
// Remove marker on click
marker.events.on('click').each(() => {
  marker.remove();
});

// Remove all markers matching criteria
map.markers.getAll()
  .filter(m => m.data?.category === 'temp')
  .forEach(m => m.remove());
```

***

### setData()

> **setData**(`data`): `void`

Defined in: [entities/Marker.ts:249](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L249)

Attach custom user data to this marker.

#### Parameters

##### data

`T`

Custom data to attach

#### Returns

`void`

#### Remarks

Triggers a renderer sync to update marker data references.

#### Example

```ts
// Tag marker with POI information
marker.setData({ 
  id: 'poi-1', 
  category: 'shop',
  name: 'Coffee House'
});

// Update data later
marker.setData({ 
  ...marker.data,
  visited: true 
});
```

***

### setStyle()

> **setStyle**(`opts`): `void`

Defined in: [entities/Marker.ts:274](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L274)

Update the marker's visual style properties.

#### Parameters

##### opts

Style properties to update

###### iconType?

`string`

New icon type identifier

###### rotation?

`number`

New rotation in degrees

###### size?

`number`

New scale multiplier

#### Returns

`void`

#### Remarks

Only provided properties are updated. Triggers a renderer sync.

#### Example

```ts
// Change icon type
marker.setStyle({ iconType: 'selected' });

// Update size and rotation
marker.setStyle({ size: 1.5, rotation: 90 });
```

***

### toData()

> **toData**(): [`MarkerData`](Interface.MarkerData.md)\<`T`\>

Defined in: [entities/Marker.ts:353](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L353)

Get a snapshot of marker data for events and serialization.

#### Returns

[`MarkerData`](Interface.MarkerData.md)\<`T`\>

Marker data including ID, position, and custom data

#### Remarks

Used internally for event payloads and renderer sync.

#### Example

```ts
// Serialize marker state
const snapshot = marker.toData();
console.log(snapshot); // { id: 'm_abc', x: 1000, y: 1500, data: {...} }
```

***

### transition()

> **transition**(): [`MarkerTransition`](Interface.MarkerTransition.md)

Defined in: [entities/Marker.ts:403](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L403)

Start a chainable marker transition builder.

#### Returns

[`MarkerTransition`](Interface.MarkerTransition.md)

A new transition builder for this marker

#### Remarks

Multiple transitions can be created but only one runs at a time.
Starting a new transition cancels any active transition.

#### Example

```ts
// Animate to new position
await marker.transition()
  .moveTo(2000, 1500)
  .apply({ animate: { durationMs: 600 } });
```

***

### ~~transitions()~~

> **transitions**(): [`MarkerTransition`](Interface.MarkerTransition.md)

Defined in: [entities/Marker.ts:409](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Marker.ts#L409)

Alias for [Marker.transition](#transition).

#### Returns

[`MarkerTransition`](Interface.MarkerTransition.md)

#### Deprecated

Use `transition()` instead
