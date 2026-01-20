[**@gaming.tools/gtmap**](README.md)

***

# Interface: MarkerEvents\<T\>

[← Back to API index](./README.md)

## Contents

- [Extends](#extends)
- [Type Parameters](#type-parameters)
  - [T](#t)
- [Methods](#methods)
  - [on()](#on)
  - [once()](#once)

Defined in: [api/events/public.ts:63](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/events/public.ts#L63)

Marker events surface with typed names and payloads.

## Extends

- [`PublicEvents`](Interface.PublicEvents.md)\<[`MarkerEventMap`](Interface.MarkerEventMap.md)\<`T`\>\>

## Type Parameters

### T

`T` = `unknown`

## Methods

### on()

#### Call Signature

> **on**\<`K`\>(`event`): [`EventSubscription`](Interface.EventSubscription.md)\<[`MarkerEventMap`](Interface.MarkerEventMap.md)\<`T`\>\[`K`\]\>

Defined in: [api/events/public.ts:69](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/events/public.ts#L69)

Subscribe to a marker event.

Supported names: 'click' | 'tap' | 'longpress' | 'pointerdown' | 'pointerup' | 'pointerenter' | 'pointerleave' | 'positionchange' | 'remove'

##### Type Parameters

###### K

`K` *extends* `"click"` \| `"remove"` \| `"pointerdown"` \| `"pointerup"` \| `"longpress"` \| `"pointerenter"` \| `"pointerleave"` \| `"tap"` \| `"positionchange"`

##### Parameters

###### event

`K`

##### Returns

[`EventSubscription`](Interface.EventSubscription.md)\<[`MarkerEventMap`](Interface.MarkerEventMap.md)\<`T`\>\[`K`\]\>

##### Overrides

[`PublicEvents`](Interface.PublicEvents.md).[`on`](Interface.PublicEvents.md#on)

#### Call Signature

> **on**\<`K`\>(`event`, `handler`): [`Unsubscribe`](TypeAlias.Unsubscribe.md)

Defined in: [api/events/public.ts:70](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/events/public.ts#L70)

Subscribe to a named event.

##### Type Parameters

###### K

`K` *extends* `"click"` \| `"remove"` \| `"pointerdown"` \| `"pointerup"` \| `"longpress"` \| `"pointerenter"` \| `"pointerleave"` \| `"tap"` \| `"positionchange"`

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

> **once**\<`K`\>(`event`): `Promise`\<[`MarkerEventMap`](Interface.MarkerEventMap.md)\<`T`\>\[`K`\]\>

Defined in: [api/events/public.ts:52](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/events/public.ts#L52)

Wait for the next event occurrence and resolve with its payload.

#### Type Parameters

##### K

`K` *extends* `"click"` \| `"remove"` \| `"pointerdown"` \| `"pointerup"` \| `"longpress"` \| `"pointerenter"` \| `"pointerleave"` \| `"tap"` \| `"positionchange"`

#### Parameters

##### event

`K`

Event name (typed)

#### Returns

`Promise`\<[`MarkerEventMap`](Interface.MarkerEventMap.md)\<`T`\>\[`K`\]\>

Promise that resolves with the payload of the next event.

#### Example

```ts
await marker.events.once('remove');
```

#### Inherited from

[`PublicEvents`](Interface.PublicEvents.md).[`once`](Interface.PublicEvents.md#once)
