[**@gaming.tools/gtmap**](README.md)

***

# Class: Layer\<T\>

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Example](#example)
- [Type Parameters](#type-parameters)
  - [T](#t)
- [Properties](#properties)
  - [events](#events)
  - [id](#id)
- [Accessors](#accessors)
  - [visible](#visible)
- [Methods](#methods)
  - [add()](#add)
  - [clear()](#clear)
  - [get()](#get)
  - [getAll()](#getall)
  - [remove()](#remove)
  - [setVisible()](#setvisible)

Defined in: [entities/Layer.ts:65](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Layer.ts#L65)

Layer - a collection of entities with lifecycle and visibility management.

## Remarks

Layers manage collections of map entities (markers, vectors) with:
- Automatic entity lifecycle management
- Visibility toggling for all entities
- Event emissions for entity changes

Events emitted via [layer.events](#events):
- `entityadd` - Entity added to layer
- `entityremove` - Entity removed from layer
- `clear` - All entities removed
- `visibilitychange` - Layer visibility toggled

## Example

```ts
// Access the default markers layer
const layer = map.markers;

// Listen for entity changes
layer.events.on('entityadd').each(({ entity }) => {
  console.log('Added:', entity.id);
});

// Toggle visibility
layer.setVisible(false); // Hide all markers

// Get all entities
const allMarkers = layer.getAll();
```

## Type Parameters

### T

`T` *extends* `object`

Entity type that must have an `id` property and `remove()` method

## Properties

### events

> `readonly` **events**: [`LayerEvents`](Interface.LayerEvents.md)\<`T`\>

Defined in: [entities/Layer.ts:83](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Layer.ts#L83)

Read-only typed events surface for this layer.

#### Example

```ts
// Subscribe to entity additions
layer.events.on('entityadd').each(({ entity }) => {
  console.log('Added entity:', entity.id);
});

// Wait for visibility change
await layer.events.once('visibilitychange');
```

***

### id

> `readonly` **id**: `string`

Defined in: [entities/Layer.ts:66](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Layer.ts#L66)

## Accessors

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [entities/Layer.ts:257](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Layer.ts#L257)

Current visibility state of this layer.

##### Example

```ts
if (layer.visible) {
  console.log('Layer is currently visible');
}
```

##### Returns

`boolean`

## Methods

### add()

> **add**(`entity`): `T`

Defined in: [entities/Layer.ts:122](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Layer.ts#L122)

Add an entity to this layer.

#### Parameters

##### entity

`T`

Entity to add

#### Returns

`T`

The added entity for chaining

#### Remarks

Emits an `entityadd` event and triggers renderer sync.

#### Example

```ts
// Manually add a marker to a layer
const marker = new Marker(1000, 1000);
layer.add(marker);
```

***

### clear()

> **clear**(): `void`

Defined in: [entities/Layer.ts:172](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Layer.ts#L172)

Remove all entities from this layer.

#### Returns

`void`

#### Remarks

Calls `remove()` on each entity, clears the collection,
emits a `clear` event, and triggers renderer sync.

#### Example

```ts
// Clear all markers
map.markers.clear();

// Equivalent to map.clearMarkers()
```

***

### get()

> **get**(`id`): `undefined` \| `T`

Defined in: [entities/Layer.ts:220](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Layer.ts#L220)

Get an entity by its ID.

#### Parameters

##### id

`string`

Entity ID to look up

#### Returns

`undefined` \| `T`

The entity if found, `undefined` otherwise

#### Example

```ts
const marker = layer.get('m_abc123');
if (marker) {
  marker.moveTo(2000, 1500);
}
```

***

### getAll()

> **getAll**(): `T`[]

Defined in: [entities/Layer.ts:243](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Layer.ts#L243)

Get all entities in this layer.

#### Returns

`T`[]

Array snapshot of all entities

#### Remarks

Returns a new array each call. Safe to mutate the returned array.

#### Example

```ts
// Iterate all markers
layer.getAll().forEach(marker => {
  console.log(marker.x, marker.y);
});

// Filter entities
const nearbyMarkers = layer.getAll()
  .filter(m => m.x < 2000 && m.y < 2000);
```

***

### remove()

> **remove**(`entityOrId`): `void`

Defined in: [entities/Layer.ts:147](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Layer.ts#L147)

Remove an entity from this layer.

#### Parameters

##### entityOrId

Entity instance or its ID string

`string` | `T`

#### Returns

`void`

#### Remarks

Emits an `entityremove` event, calls the entity's `remove()` method,
and triggers renderer sync.

#### Example

```ts
// Remove by entity reference
layer.remove(marker);

// Remove by ID
layer.remove('m_abc123');
```

***

### setVisible()

> **setVisible**(`visible`): `void`

Defined in: [entities/Layer.ts:199](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/entities/Layer.ts#L199)

Set the visibility of all entities in this layer.

#### Parameters

##### visible

`boolean`

`true` to show, `false` to hide

#### Returns

`void`

#### Remarks

Only emits `visibilitychange` event if the visibility actually changes.
Triggers renderer sync to update display.

#### Example

```ts
// Toggle layer visibility
layer.setVisible(!layer.visible);

// Hide layer temporarily
layer.setVisible(false);
await someAsyncOperation();
layer.setVisible(true);
```
