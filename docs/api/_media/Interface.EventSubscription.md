[**@gaming.tools/gtmap**](README.md)

***

# Interface: EventSubscription\<T\>

Defined in: [api/events/public.ts:5](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/events/public.ts#L5)

Minimal subscription interface exposed publicly.

## Type Parameters

### T

`T`

## Methods

### each()

> **each**(`handler`): [`Unsubscribe`](TypeAlias.Unsubscribe.md)

Defined in: [api/events/public.ts:7](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/events/public.ts#L7)

Register a handler and receive an `Unsubscribe` function.

#### Parameters

##### handler

(`value`) => `void`

#### Returns

[`Unsubscribe`](TypeAlias.Unsubscribe.md)
