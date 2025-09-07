[**@gaming.tools/gtmap**](README.md)

***

# Interface: EventSubscription\<T\>

Defined in: [api/events/public.ts:5](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/events/public.ts#L5)

Minimal subscription interface exposed publicly.

## Type Parameters

### T

`T`

## Methods

### each()

> **each**(`handler`): `Unsubscribe`

Defined in: [api/events/public.ts:7](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/events/public.ts#L7)

Register a handler and receive an `Unsubscribe` function.

#### Parameters

##### handler

(`value`) => `void`

#### Returns

`Unsubscribe`
