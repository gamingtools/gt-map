[**@gaming.tools/gtmap**](README.md)

***

# Class: Layer\<T\>

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
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

Defined in: entities/layer.ts:24

Layer<T> - a collection of entities with lifecycle and visibility.

## Remarks

Emits typed events on add/remove/clear/visibility change.

## Type Parameters

### T

`T` *extends* `object`

## Properties

### events

> `readonly` **events**: [`LayerEvents`](Interface.LayerEvents.md)\<`T`\>

Defined in: entities/layer.ts:28

Read‑only typed events for this layer.

***

### id

> `readonly` **id**: `string`

Defined in: entities/layer.ts:25

## Accessors

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: entities/layer.ts:95

Current visibility state.

##### Returns

`boolean`

## Methods

### add()

> **add**(`entity`): `T`

Defined in: entities/layer.ts:52

Add an entity and emit `entityadd`.

#### Parameters

##### entity

`T`

#### Returns

`T`

***

### clear()

> **clear**(): `void`

Defined in: entities/layer.ts:71

Remove all entities and emit `clear`.

#### Returns

`void`

***

### get()

> **get**(`id`): `undefined` \| `T`

Defined in: entities/layer.ts:87

Get an entity by id.

#### Parameters

##### id

`string`

#### Returns

`undefined` \| `T`

***

### getAll()

> **getAll**(): `T`[]

Defined in: entities/layer.ts:91

Get a snapshot array of all entities.

#### Returns

`T`[]

***

### remove()

> **remove**(`entityOrId`): `void`

Defined in: entities/layer.ts:60

Remove an entity (by instance or id) and emit `entityremove`.

#### Parameters

##### entityOrId

`string` | `T`

#### Returns

`void`

***

### setVisible()

> **setVisible**(`visible`): `void`

Defined in: entities/layer.ts:79

Set layer visibility and emit `visibilitychange` when it changes.

#### Parameters

##### visible

`boolean`

#### Returns

`void`
