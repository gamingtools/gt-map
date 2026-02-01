[**@gaming.tools/gtmap**](README.md)

***

# Interface: EventSubscription\<T\>

[← Back to API index](./README.md)

## Contents

- [Type Parameters](#type-parameters)
  - [T](#t)
- [Methods](#methods)
  - [each()](#each)

Defined in: [api/events/public.ts:5](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/events/public.ts#L5)

Minimal subscription interface exposed publicly.

## Type Parameters

### T

`T`

## Methods

### each()

> **each**(`handler`): [`Unsubscribe`](TypeAlias.Unsubscribe.md)

Defined in: [api/events/public.ts:7](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/events/public.ts#L7)

Register a handler and receive an `Unsubscribe` function.

#### Parameters

##### handler

(`value`) => `void`

#### Returns

[`Unsubscribe`](TypeAlias.Unsubscribe.md)
