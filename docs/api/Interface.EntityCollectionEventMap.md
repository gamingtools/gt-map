[**@gaming.tools/gtmap**](README.md)

***

# Interface: EntityCollectionEventMap\<T\>

Defined in: [api/events/maps.ts:97](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/events/maps.ts#L97)

Events emitted by an EntityCollection for entity management and visibility.

## Type Parameters

### T

`T`

## Properties

### clear

> **clear**: `object`

Defined in: [api/events/maps.ts:103](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/events/maps.ts#L103)

All entities were removed.

***

### entityadd

> **entityadd**: `object`

Defined in: [api/events/maps.ts:99](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/events/maps.ts#L99)

A new entity was added to the collection.

#### entity

> **entity**: `T`

***

### entityremove

> **entityremove**: `object`

Defined in: [api/events/maps.ts:101](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/events/maps.ts#L101)

An entity was removed from the collection.

#### entity

> **entity**: `T`

***

### visibilitychange

> **visibilitychange**: `object`

Defined in: [api/events/maps.ts:105](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/events/maps.ts#L105)

Visibility of the collection changed.

#### visible

> **visible**: `boolean`
