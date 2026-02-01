[**@gaming.tools/gtmap**](README.md)

***

# Class: EntityCollection\<T\>

Defined in: [entities/entity-collection.ts:24](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L24)

EntityCollection<T> - a collection of entities with lifecycle and visibility.

## Remarks

Emits typed events on add/remove/clear/visibility change.

## Type Parameters

### T

`T` *extends* `object`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [entities/entity-collection.ts:25](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L25)

## Accessors

### events

#### Get Signature

> **get** **events**(): [`EntityCollectionEvents`](Interface.EntityCollectionEvents.md)\<`T`\>

Defined in: [entities/entity-collection.ts:28](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L28)

Read-only typed events for this collection.

##### Returns

[`EntityCollectionEvents`](Interface.EntityCollectionEvents.md)\<`T`\>

***

### filter

#### Get Signature

> **get** **filter**(): `null` \| (`entity`) => `boolean`

Defined in: [entities/entity-collection.ts:125](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L125)

Get the current filter predicate, or null if none.

##### Returns

`null` \| (`entity`) => `boolean`

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [entities/entity-collection.ts:98](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L98)

Current visibility state.

##### Returns

`boolean`

## Methods

### add()

> **add**(`entity`): `T`

Defined in: [entities/entity-collection.ts:55](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L55)

Add an entity and emit `entityadd`.

#### Parameters

##### entity

`T`

#### Returns

`T`

***

### clear()

> **clear**(): `void`

Defined in: [entities/entity-collection.ts:74](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L74)

Remove all entities and emit `clear`.

#### Returns

`void`

***

### count()

> **count**(`predicate?`): `number`

Defined in: [entities/entity-collection.ts:165](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L165)

Count entities, optionally matching a predicate.

#### Parameters

##### predicate?

(`entity`) => `boolean`

Optional filter function

#### Returns

`number`

Count of matching entities (or total if no predicate)

#### Example

```ts
const total = map.markers.count();
const resourceCount = map.markers.count(m => m.data.category === 'resource');
```

***

### find()

> **find**(`predicate`): `T`[]

Defined in: [entities/entity-collection.ts:149](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L149)

Find entities matching a predicate.

#### Parameters

##### predicate

(`entity`) => `boolean`

Filter function

#### Returns

`T`[]

Array of matching entities

#### Example

```ts
const rareItems = map.markers.find(m => m.data.tier === 'rare');
```

***

### get()

> **get**(`id`): `undefined` \| `T`

Defined in: [entities/entity-collection.ts:90](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L90)

Get an entity by id.

#### Parameters

##### id

`string`

#### Returns

`undefined` \| `T`

***

### getAll()

> **getAll**(): `T`[]

Defined in: [entities/entity-collection.ts:94](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L94)

Get a snapshot array of all entities.

#### Returns

`T`[]

***

### getFiltered()

> **getFiltered**(): `T`[]

Defined in: [entities/entity-collection.ts:133](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L133)

Get entities that pass the current filter (or all if no filter).
Used internally by the renderer.

#### Returns

`T`[]

***

### remove()

> **remove**(`entityOrId`): `void`

Defined in: [entities/entity-collection.ts:63](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L63)

Remove an entity (by instance or id) and emit `entityremove`.

#### Parameters

##### entityOrId

`string` | `T`

#### Returns

`void`

***

### setFilter()

> **setFilter**(`predicate`): `this`

Defined in: [entities/entity-collection.ts:118](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L118)

Set a filter predicate to control entity visibility.
Entities not matching the predicate will be hidden from rendering.
Pass `null` to clear the filter and show all entities.

#### Parameters

##### predicate

Filter function or null to clear

`null` | (`entity`) => `boolean`

#### Returns

`this`

This collection for chaining

#### Example

```ts
// Show only resources
map.markers.setFilter(m => m.data.category === 'resource');
// Clear filter
map.markers.setFilter(null);
```

***

### setVisible()

> **setVisible**(`visible`): `void`

Defined in: [entities/entity-collection.ts:82](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/entities/entity-collection.ts#L82)

Set collection visibility and emit `visibilitychange` when it changes.

#### Parameters

##### visible

`boolean`

#### Returns

`void`
