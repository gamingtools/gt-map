[**@gaming.tools/gtmap**](README.md)

***

# Interface: PublicEvents\<EventMap\>

Defined in: [api/events/public.ts:17](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/events/public.ts#L17)

Public read-only events surface for entities and map.

Provides typed subscriptions via `on(event)` and one-shot via `once(event)`.
Handlers run synchronously in emit order. Each subscription returns an
`Unsubscribe` function via `stream.each(handler)`.

## Extended by

- [`MarkerEvents`](Interface.MarkerEvents.md)
- [`VectorEvents`](Interface.VectorEvents.md)
- [`LayerEvents`](Interface.LayerEvents.md)
- [`MapEvents`](Interface.MapEvents.md)

## Type Parameters

### EventMap

`EventMap`

## Methods

### on()

#### Call Signature

> **on**\<`K`\>(`event`): [`EventSubscription`](Interface.EventSubscription.md)\<`EventMap`\[`K`\]\>

Defined in: [api/events/public.ts:29](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/events/public.ts#L29)

Subscribe to a named event.

##### Type Parameters

###### K

`K` *extends* `string`

##### Parameters

###### event

`K`

Event name (typed by the entity's event map)

##### Returns

[`EventSubscription`](Interface.EventSubscription.md)\<`EventMap`\[`K`\]\>

An `EventStream<Payload>` with `.each(handler)` to subscribe.

##### Example

```ts
marker.events.on('click').each((e) => {
  console.log('clicked at', e.x, e.y);
});
```

#### Call Signature

> **on**\<`K`\>(`event`, `handler`): [`Unsubscribe`](TypeAlias.Unsubscribe.md)

Defined in: [api/events/public.ts:42](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/events/public.ts#L42)

Subscribe to a named event with an inline handler.

##### Type Parameters

###### K

`K` *extends* `string`

##### Parameters

###### event

`K`

Event name (typed)

###### handler

(`value`) => `void`

Handler invoked synchronously with the event payload

##### Returns

[`Unsubscribe`](TypeAlias.Unsubscribe.md)

An `Unsubscribe` function

##### Example

```ts
marker.events.on('click', (e) => {
  console.log('clicked at', e.x, e.y);
});
```

***

### once()

> **once**\<`K`\>(`event`): `Promise`\<`EventMap`\[`K`\]\>

Defined in: [api/events/public.ts:52](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/events/public.ts#L52)

Wait for the next event occurrence and resolve with its payload.

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### event

`K`

Event name (typed)

#### Returns

`Promise`\<`EventMap`\[`K`\]\>

Promise that resolves with the payload of the next event.

#### Example

```ts
await marker.events.once('remove');
```
