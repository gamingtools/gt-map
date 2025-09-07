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

Defined in: [entities/Layer.ts:24](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/entities/Layer.ts#L24)

Layer<T> - a collection of entities with lifecycle and visibility.

## Remarks

Emits typed events on add/remove/clear/visibility change.

## Type Parameters

### T

`T` *extends* `object`

## Properties

### events

> `readonly` **events**: [`LayerEvents`](Interface.LayerEvents.md)\<`T`\>

Defined in: [entities/Layer.ts:28](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/entities/Layer.ts#L28)

Read‑only typed events for this layer.

***

### id

> `readonly` **id**: `string`

Defined in: [entities/Layer.ts:25](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/entities/Layer.ts#L25)

## Accessors

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [entities/Layer.ts:95](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/entities/Layer.ts#L95)

Current visibility state.

##### Returns

`boolean`

## Methods

### add()

> **add**(`entity`): `T`

Defined in: [entities/Layer.ts:52](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/entities/Layer.ts#L52)

Add an entity and emit `entityadd`.

#### Parameters

##### entity

`T`

#### Returns

`T`

***

### clear()

> **clear**(): `void`

Defined in: [entities/Layer.ts:71](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/entities/Layer.ts#L71)

Remove all entities and emit `clear`.

#### Returns

`void`

***

### get()

> **get**(`id`): `undefined` \| `T`

Defined in: [entities/Layer.ts:87](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/entities/Layer.ts#L87)

Get an entity by id.

#### Parameters

##### id

`string`

#### Returns

`undefined` \| `T`

***

### getAll()

> **getAll**(): `T`[]

Defined in: [entities/Layer.ts:91](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/entities/Layer.ts#L91)

Get a snapshot array of all entities.

#### Returns

`T`[]

***

### remove()

> **remove**(`entityOrId`): `void`

Defined in: [entities/Layer.ts:60](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/entities/Layer.ts#L60)

Remove an entity (by instance or id) and emit `entityremove`.

#### Parameters

##### entityOrId

`string` | `T`

#### Returns

`void`

***

### setVisible()

> **setVisible**(`visible`): `void`

Defined in: [entities/Layer.ts:79](https://github.com/gamingtools/gt-map/blob/456675b84d19e7c9d557294c3b19a4bb0dcd9d51/packages/gtmap/src/entities/Layer.ts#L79)

Set layer visibility and emit `visibilitychange` when it changes.

#### Parameters

##### visible

`boolean`

#### Returns

`void`
