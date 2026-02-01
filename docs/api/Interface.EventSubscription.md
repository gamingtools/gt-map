[**@gaming.tools/gtmap**](README.md)

***

# Interface: EventSubscription\<T\>

Defined in: [api/events/public.ts:5](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/events/public.ts#L5)

Minimal subscription interface exposed publicly.

## Type Parameters

### T

`T`

## Methods

### each()

> **each**(`handler`): [`Unsubscribe`](TypeAlias.Unsubscribe.md)

Defined in: [api/events/public.ts:7](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/events/public.ts#L7)

Register a handler and receive an `Unsubscribe` function.

#### Parameters

##### handler

(`value`) => `void`

#### Returns

[`Unsubscribe`](TypeAlias.Unsubscribe.md)
