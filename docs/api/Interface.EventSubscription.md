[**@gaming.tools/gtmap**](README.md)

***

# Interface: EventSubscription\<T\>

Defined in: [api/events/public.ts:5](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/events/public.ts#L5)

Minimal subscription interface exposed publicly.

## Type Parameters

### T

`T`

## Methods

### each()

> **each**(`handler`): [`Unsubscribe`](TypeAlias.Unsubscribe.md)

Defined in: [api/events/public.ts:7](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/events/public.ts#L7)

Register a handler and receive an `Unsubscribe` function.

#### Parameters

##### handler

(`value`) => `void`

#### Returns

[`Unsubscribe`](TypeAlias.Unsubscribe.md)
