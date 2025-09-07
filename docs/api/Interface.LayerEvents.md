[**@gaming.tools/gtmap**](README.md)

***

# Interface: LayerEvents\<T\>

Defined in: [api/events/public.ts:80](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/events/public.ts#L80)

Layer events surface with typed names and payloads.

## Extends

- [`PublicEvents`](Interface.PublicEvents.md)\<`LayerEventMap`\<`T`\>\>

## Type Parameters

### T

`T`

## Methods

### on()

#### Call Signature

> **on**\<`K`\>(`event`): [`EventSubscription`](Interface.EventSubscription.md)\<`LayerEventMap`\<`T`\>\[`K`\]\>

Defined in: [api/events/public.ts:82](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/events/public.ts#L82)

Supported names: 'entityadd' | 'entityremove' | 'clear' | 'visibilitychange'

##### Type Parameters

###### K

`K` *extends* `"clear"` \| `"entityadd"` \| `"entityremove"` \| `"visibilitychange"`

##### Parameters

###### event

`K`

##### Returns

[`EventSubscription`](Interface.EventSubscription.md)\<`LayerEventMap`\<`T`\>\[`K`\]\>

##### Overrides

[`PublicEvents`](Interface.PublicEvents.md).[`on`](Interface.PublicEvents.md#on)

#### Call Signature

> **on**\<`K`\>(`event`, `handler`): `Unsubscribe`

Defined in: [api/events/public.ts:83](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/events/public.ts#L83)

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

`Unsubscribe`

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

> **once**\<`K`\>(`event`): `Promise`\<`LayerEventMap`\<`T`\>\[`K`\]\>

Defined in: [api/events/public.ts:52](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/events/public.ts#L52)

Wait for the next event occurrence and resolve with its payload.

#### Type Parameters

##### K

`K` *extends* `"clear"` \| `"entityadd"` \| `"entityremove"` \| `"visibilitychange"`

#### Parameters

##### event

`K`

Event name (typed)

#### Returns

`Promise`\<`LayerEventMap`\<`T`\>\[`K`\]\>

Promise that resolves with the payload of the next event.

#### Example

```ts
await marker.events.once('remove');
```

#### Inherited from

[`PublicEvents`](Interface.PublicEvents.md).[`once`](Interface.PublicEvents.md#once)
