[**@gaming.tools/gtmap**](README.md)

***

# Interface: VectorEvents

Defined in: [api/events/public.ts:73](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/events/public.ts#L73)

Vector events surface with typed names and payloads.

## Extends

- [`PublicEvents`](Interface.PublicEvents.md)\<[`VectorEventMap`](Interface.VectorEventMap.md)\>

## Methods

### on()

#### Call Signature

> **on**\<`K`\>(`event`): [`EventSubscription`](Interface.EventSubscription.md)\<[`VectorEventMap`](Interface.VectorEventMap.md)\[`K`\]\>

Defined in: [api/events/public.ts:75](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/events/public.ts#L75)

Supported names: 'remove'

##### Type Parameters

###### K

`K` *extends* `"remove"`

##### Parameters

###### event

`K`

##### Returns

[`EventSubscription`](Interface.EventSubscription.md)\<[`VectorEventMap`](Interface.VectorEventMap.md)\[`K`\]\>

##### Overrides

[`PublicEvents`](Interface.PublicEvents.md).[`on`](Interface.PublicEvents.md#on)

#### Call Signature

> **on**\<`K`\>(`event`, `handler`): [`Unsubscribe`](TypeAlias.Unsubscribe.md)

Defined in: [api/events/public.ts:76](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/events/public.ts#L76)

Subscribe to a named event.

##### Type Parameters

###### K

`K` *extends* `"remove"`

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

> **once**\<`K`\>(`event`): `Promise`\<[`VectorEventMap`](Interface.VectorEventMap.md)\[`K`\]\>

Defined in: [api/events/public.ts:52](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/events/public.ts#L52)

Wait for the next event occurrence and resolve with its payload.

#### Type Parameters

##### K

`K` *extends* `"remove"`

#### Parameters

##### event

`K`

Event name (typed)

#### Returns

`Promise`\<[`VectorEventMap`](Interface.VectorEventMap.md)\[`K`\]\>

Promise that resolves with the payload of the next event.

#### Example

```ts
await marker.events.once('remove');
```

#### Inherited from

[`PublicEvents`](Interface.PublicEvents.md).[`once`](Interface.PublicEvents.md#once)
