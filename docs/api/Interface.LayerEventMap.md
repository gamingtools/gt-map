[**@gaming.tools/gtmap**](README.md)

***

# Interface: LayerEventMap\<T\>

Defined in: [api/events/maps.ts:79](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L79)

Events emitted by a Layer for entity management and visibility.

## Type Parameters

### T

`T`

## Properties

### clear

> **clear**: `object`

Defined in: [api/events/maps.ts:85](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L85)

All entities were removed.

***

### entityadd

> **entityadd**: `object`

Defined in: [api/events/maps.ts:81](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L81)

A new entity was added to the layer.

#### entity

> **entity**: `T`

***

### entityremove

> **entityremove**: `object`

Defined in: [api/events/maps.ts:83](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L83)

An entity was removed from the layer.

#### entity

> **entity**: `T`

***

### visibilitychange

> **visibilitychange**: `object`

Defined in: [api/events/maps.ts:87](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/events/maps.ts#L87)

Visibility of the layer changed.

#### visible

> **visible**: `boolean`
