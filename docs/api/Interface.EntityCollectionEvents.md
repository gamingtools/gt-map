[**@gaming.tools/gtmap**](README.md)

***

# Interface: EntityCollectionEvents\<T\>

[← Back to API index](./README.md)

## Contents

- [Extends](#extends)
- [Type Parameters](#type-parameters)
  - [T](#t)
- [Methods](#methods)
  - [on()](#on)
  - [once()](#once)

Defined in: [api/events/public.ts:88](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/public.ts#L88)

EntityCollection events surface with typed names and payloads.

## Extends

- [`PublicEvents`](Interface.PublicEvents.md)\<[`EntityCollectionEventMap`](Interface.EntityCollectionEventMap.md)\<`T`\>\>

## Type Parameters

### T

`T`

## Methods

### on()

#### Call Signature

> **on**\<`K`\>(`event`): [`EventSubscription`](Interface.EventSubscription.md)\<[`EntityCollectionEventMap`](Interface.EntityCollectionEventMap.md)\<`T`\>\[`K`\]\>

Defined in: [api/events/public.ts:90](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/public.ts#L90)

Supported names: 'entityadd' | 'entityremove' | 'clear' | 'visibilitychange'

##### Type Parameters

###### K

`K` *extends* `"clear"` \| `"entityadd"` \| `"entityremove"` \| `"visibilitychange"`

##### Parameters

###### event

`K`

##### Returns

[`EventSubscription`](Interface.EventSubscription.md)\<[`EntityCollectionEventMap`](Interface.EntityCollectionEventMap.md)\<`T`\>\[`K`\]\>

##### Overrides

[`PublicEvents`](Interface.PublicEvents.md).[`on`](Interface.PublicEvents.md#on)

#### Call Signature

> **on**\<`K`\>(`event`, `handler`): [`Unsubscribe`](TypeAlias.Unsubscribe.md)

Defined in: [api/events/public.ts:91](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/public.ts#L91)

Subscribe to a named event.

##### Type Parameters

###### K

`K` *extends* `"clear"` \| `"entityadd"` \| `"entityremove"` \| `"visibilitychange"`

##### Parameters

###### event

`K`

Event name (typed by the entity's event map)

###### handler

(`value`) => `void`

##### Returns

[`Unsubscribe`](TypeAlias.Unsubscribe.md)

An `EventStream<Payload>` with `.each(handler)` to subscribe.

##### Example

```ts
marker.events.on('click').each((e) => {
  console.log('clicked at', e.x, e.y);
});
```

##### Overrides

[`PublicEvents`](Interface.PublicEvents.md).[`on`](Interface.PublicEvents.md#on)

***

### once()

> **once**\<`K`\>(`event`): `Promise`\<[`EntityCollectionEventMap`](Interface.EntityCollectionEventMap.md)\<`T`\>\[`K`\]\>

Defined in: [api/events/public.ts:52](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/events/public.ts#L52)

Wait for the next event occurrence and resolve with its payload.

#### Type Parameters

##### K

`K` *extends* `"clear"` \| `"entityadd"` \| `"entityremove"` \| `"visibilitychange"`

#### Parameters

##### event

`K`

Event name (typed)

#### Returns

`Promise`\<[`EntityCollectionEventMap`](Interface.EntityCollectionEventMap.md)\<`T`\>\[`K`\]\>

Promise that resolves with the payload of the next event.

#### Example

```ts
await marker.events.once('remove');
```

#### Inherited from

[`PublicEvents`](Interface.PublicEvents.md).[`once`](Interface.PublicEvents.md#once)
