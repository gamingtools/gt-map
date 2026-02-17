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

Defined in: [api/events/maps.ts:81](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L81)

Events emitted by an EntityCollection for entity management and visibility.

## Type Parameters

### T

`T`

## Properties

### clear

> **clear**: `object`

Defined in: [api/events/maps.ts:87](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L87)

All entities were removed.

***

### entityadd

> **entityadd**: `object`

Defined in: [api/events/maps.ts:83](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L83)

A new entity was added to the collection.

#### entity

> **entity**: `T`

***

### entityremove

> **entityremove**: `object`

Defined in: [api/events/maps.ts:85](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L85)

An entity was removed from the collection.

#### entity

> **entity**: `T`

***

### visibilitychange

> **visibilitychange**: `object`

Defined in: [api/events/maps.ts:89](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/maps.ts#L89)

Visibility of the collection changed.

#### visible

> **visible**: `boolean`
