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
  - [visible](#visible)
- [Methods](#methods)
  - [add()](#add)
  - [clear()](#clear)
  - [get()](#get)
  - [getAll()](#getall)
  - [remove()](#remove)
  - [setVisible()](#setvisible)

Defined in: entities/entity-collection.ts:24

EntityCollection<T> - a collection of entities with lifecycle and visibility.

## Remarks

Emits typed events on add/remove/clear/visibility change.

## Type Parameters

### T

`T` *extends* `object`

## Properties

### id

> `readonly` **id**: `string`

Defined in: entities/entity-collection.ts:25

## Accessors

### events

#### Get Signature

> **get** **events**(): [`EntityCollectionEvents`](Interface.EntityCollectionEvents.md)\<`T`\>

Defined in: entities/entity-collection.ts:28

Read-only typed events for this collection.

##### Returns

[`EntityCollectionEvents`](Interface.EntityCollectionEvents.md)\<`T`\>

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: entities/entity-collection.ts:97

Current visibility state.

##### Returns

`boolean`

## Methods

### add()

> **add**(`entity`): `T`

Defined in: entities/entity-collection.ts:54

Add an entity and emit `entityadd`.

#### Parameters

##### entity

`T`

#### Returns

`T`

***

### clear()

> **clear**(): `void`

Defined in: entities/entity-collection.ts:73

Remove all entities and emit `clear`.

#### Returns

`void`

***

### get()

> **get**(`id`): `undefined` \| `T`

Defined in: entities/entity-collection.ts:89

Get an entity by id.

#### Parameters

##### id

`string`

#### Returns

`undefined` \| `T`

***

### getAll()

> **getAll**(): `T`[]

Defined in: entities/entity-collection.ts:93

Get a snapshot array of all entities.

#### Returns

`T`[]

***

### remove()

> **remove**(`entityOrId`): `void`

Defined in: entities/entity-collection.ts:62

Remove an entity (by instance or id) and emit `entityremove`.

#### Parameters

##### entityOrId

`string` | `T`

#### Returns

`void`

***

### setVisible()

> **setVisible**(`visible`): `void`

Defined in: entities/entity-collection.ts:81

Set collection visibility and emit `visibilitychange` when it changes.

#### Parameters

##### visible

`boolean`

#### Returns

`void`
