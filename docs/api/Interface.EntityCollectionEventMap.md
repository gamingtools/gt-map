[**@gaming.tools/gtmap**](README.md)

***

# Interface: EntityCollectionEventMap\<T\>

Defined in: [api/events/maps.ts:83](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/events/maps.ts#L83)

Events emitted by an EntityCollection for entity management and visibility.

## Type Parameters

### T

`T`

## Properties

### clear

> **clear**: `object`

Defined in: [api/events/maps.ts:89](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/events/maps.ts#L89)

All entities were removed.

***

### entityadd

> **entityadd**: `object`

Defined in: [api/events/maps.ts:85](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/events/maps.ts#L85)

A new entity was added to the collection.

#### entity

> **entity**: `T`

***

### entityremove

> **entityremove**: `object`

Defined in: [api/events/maps.ts:87](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/events/maps.ts#L87)

An entity was removed from the collection.

#### entity

> **entity**: `T`

***

### visibilitychange

> **visibilitychange**: `object`

Defined in: [api/events/maps.ts:91](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/events/maps.ts#L91)

Visibility of the collection changed.

#### visible

> **visible**: `boolean`
