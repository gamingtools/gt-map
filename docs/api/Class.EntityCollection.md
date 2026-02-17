[**@gaming.tools/gtmap**](README.md)

***

# Class: EntityCollection\<T\>

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Type Parameters](#type-parameters)
  - [T](#t)
- [Properties](#properties)
  - [id](#id)
- [Accessors](#accessors)
  - [events](#events)
  - [filter](#filter)
  - [visible](#visible)
- [Methods](#methods)
  - [add()](#add)
  - [clear()](#clear)
  - [count()](#count)
  - [find()](#find)
  - [get()](#get)
  - [getAll()](#getall)
  - [getFiltered()](#getfiltered)
  - [remove()](#remove)
  - [setFilter()](#setfilter)
  - [setVisible()](#setvisible)

Defined in: [entities/entity-collection.ts:24](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L24)

EntityCollection<T> - a collection of entities with lifecycle and visibility.

## Remarks

Emits typed events on add/remove/clear/visibility change.

## Type Parameters

### T

`T` *extends* `object`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [entities/entity-collection.ts:25](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L25)

## Accessors

### events

#### Get Signature

> **get** **events**(): [`EntityCollectionEvents`](Interface.EntityCollectionEvents.md)\<`T`\>

Defined in: [entities/entity-collection.ts:28](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L28)

Read-only typed events for this collection.

##### Returns

[`EntityCollectionEvents`](Interface.EntityCollectionEvents.md)\<`T`\>

***

### filter

#### Get Signature

> **get** **filter**(): `null` \| (`entity`) => `boolean`

Defined in: [entities/entity-collection.ts:126](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L126)

Get the current filter predicate, or null if none.

##### Returns

`null` \| (`entity`) => `boolean`

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [entities/entity-collection.ts:98](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L98)

Current visibility state.

##### Returns

`boolean`

## Methods

### add()

> **add**(`entity`): `T`

Defined in: [entities/entity-collection.ts:55](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L55)

Add an entity and emit `entityadd`.

#### Parameters

##### entity

`T`

#### Returns

`T`

***

### clear()

> **clear**(): `void`

Defined in: [entities/entity-collection.ts:74](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L74)

Remove all entities and emit `clear`.

#### Returns

`void`

***

### count()

> **count**\<`TData`\>(`predicate?`): `number`

Defined in: [entities/entity-collection.ts:168](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L168)

Count entities, optionally matching a predicate.

#### Type Parameters

##### TData

`TData` = `unknown`

Optional data type for narrowing `entity.data` in the predicate

#### Parameters

##### predicate?

(`entity`) => `boolean`

Optional filter function

#### Returns

`number`

Count of matching entities (or total if no predicate)

#### Example

```ts
const total = map.content.markers.count();
const resourceCount = map.content.markers.count<MyPOI>(m => m.data.category === 'resource');
```

***

### find()

> **find**\<`TData`\>(`predicate`): `T`[]

Defined in: [entities/entity-collection.ts:151](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L151)

Find entities matching a predicate.

#### Type Parameters

##### TData

`TData` = `unknown`

Optional data type for narrowing `entity.data` in the predicate

#### Parameters

##### predicate

(`entity`) => `boolean`

Filter function

#### Returns

`T`[]

Array of matching entities

#### Example

```ts
const rareItems = map.content.markers.find<MyPOI>(m => m.data.tier === 'rare');
```

***

### get()

> **get**(`id`): `undefined` \| `T`

Defined in: [entities/entity-collection.ts:90](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L90)

Get an entity by id.

#### Parameters

##### id

`string`

#### Returns

`undefined` \| `T`

***

### getAll()

> **getAll**(): `T`[]

Defined in: [entities/entity-collection.ts:94](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L94)

Get a snapshot array of all entities.

#### Returns

`T`[]

***

### getFiltered()

> **getFiltered**(): `T`[]

Defined in: [entities/entity-collection.ts:134](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L134)

Get entities that pass the current filter (or all if no filter).
Used internally by the renderer.

#### Returns

`T`[]

***

### remove()

> **remove**(`entityOrId`): `void`

Defined in: [entities/entity-collection.ts:63](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L63)

Remove an entity (by instance or id) and emit `entityremove`.

#### Parameters

##### entityOrId

`string` | `T`

#### Returns

`void`

***

### setFilter()

> **setFilter**\<`TData`\>(`predicate`): `this`

Defined in: [entities/entity-collection.ts:119](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L119)

Set a filter predicate to control entity visibility.
Entities not matching the predicate will be hidden from rendering.
Pass `null` to clear the filter and show all entities.

#### Type Parameters

##### TData

`TData` = `unknown`

Optional data type for narrowing `entity.data` in the predicate

#### Parameters

##### predicate

Filter function or null to clear

`null` | (`entity`) => `boolean`

#### Returns

`this`

This collection for chaining

#### Example

```ts
// Show only resources (with typed data)
map.content.markers.setFilter<MyPOI>(m => m.data.category === 'resource');
// Clear filter
map.content.markers.setFilter(null);
```

***

### setVisible()

> **setVisible**(`visible`): `void`

Defined in: [entities/entity-collection.ts:82](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/entities/entity-collection.ts#L82)

Set collection visibility and emit `visibilitychange` when it changes.

#### Parameters

##### visible

`boolean`

#### Returns

`void`
