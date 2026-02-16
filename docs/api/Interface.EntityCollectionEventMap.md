[**@gaming.tools/gtmap**](README.md)

***

# Interface: EntityCollectionEventMap\<T\>

[← Back to API index](./README.md)

## Contents

- [Type Parameters](#type-parameters)
  - [T](#t)
- [Properties](#properties)
  - [clear](#clear)
  - [entityadd](#entityadd)
  - [entityremove](#entityremove)
  - [visibilitychange](#visibilitychange)

Defined in: [api/events/maps.ts:80](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L80)

Events emitted by an EntityCollection for entity management and visibility.

## Type Parameters

### T

`T`

## Properties

### clear

> **clear**: `object`

Defined in: [api/events/maps.ts:86](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L86)

All entities were removed.

***

### entityadd

> **entityadd**: `object`

Defined in: [api/events/maps.ts:82](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L82)

A new entity was added to the collection.

#### entity

> **entity**: `T`

***

### entityremove

> **entityremove**: `object`

Defined in: [api/events/maps.ts:84](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L84)

An entity was removed from the collection.

#### entity

> **entity**: `T`

***

### visibilitychange

> **visibilitychange**: `object`

Defined in: [api/events/maps.ts:88](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/events/maps.ts#L88)

Visibility of the collection changed.

#### visible

> **visible**: `boolean`
