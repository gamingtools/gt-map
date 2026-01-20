[**@gaming.tools/gtmap**](README.md)

***

# Class: Layer\<T\>

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

Defined in: [entities/layer.ts:24](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/layer.ts#L24)

Layer<T> - a collection of entities with lifecycle and visibility.

## Remarks

Emits typed events on add/remove/clear/visibility change.

## Type Parameters

### T

`T` *extends* `object`

## Properties

### id

> `readonly` **id**: `string`

Defined in: [entities/layer.ts:25](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/layer.ts#L25)

## Accessors

### events

#### Get Signature

> **get** **events**(): [`LayerEvents`](Interface.LayerEvents.md)\<`T`\>

Defined in: [entities/layer.ts:28](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/layer.ts#L28)

Read‑only typed events for this layer.

##### Returns

[`LayerEvents`](Interface.LayerEvents.md)\<`T`\>

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [entities/layer.ts:97](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/layer.ts#L97)

Current visibility state.

##### Returns

`boolean`

## Methods

### add()

> **add**(`entity`): `T`

Defined in: [entities/layer.ts:54](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/layer.ts#L54)

Add an entity and emit `entityadd`.

#### Parameters

##### entity

`T`

#### Returns

`T`

***

### clear()

> **clear**(): `void`

Defined in: [entities/layer.ts:73](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/layer.ts#L73)

Remove all entities and emit `clear`.

#### Returns

`void`

***

### get()

> **get**(`id`): `undefined` \| `T`

Defined in: [entities/layer.ts:89](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/layer.ts#L89)

Get an entity by id.

#### Parameters

##### id

`string`

#### Returns

`undefined` \| `T`

***

### getAll()

> **getAll**(): `T`[]

Defined in: [entities/layer.ts:93](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/layer.ts#L93)

Get a snapshot array of all entities.

#### Returns

`T`[]

***

### remove()

> **remove**(`entityOrId`): `void`

Defined in: [entities/layer.ts:62](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/layer.ts#L62)

Remove an entity (by instance or id) and emit `entityremove`.

#### Parameters

##### entityOrId

`string` | `T`

#### Returns

`void`

***

### setVisible()

> **setVisible**(`visible`): `void`

Defined in: [entities/layer.ts:81](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/entities/layer.ts#L81)

Set layer visibility and emit `visibilitychange` when it changes.

#### Parameters

##### visible

`boolean`

#### Returns

`void`
