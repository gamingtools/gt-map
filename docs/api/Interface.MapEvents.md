[**@gaming.tools/gtmap**](README.md)

***

# Interface: MapEvents\<T\>

Defined in: [api/events/public.ts:95](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/events/public.ts#L95)

Map events surface with typed names and payloads.

## Extends

- [`PublicEvents`](Interface.PublicEvents.md)\<[`EventMap`](Interface.EventMap.md)\<`T`\>\>

## Type Parameters

### T

`T` = `unknown`

## Methods

### on()

#### Call Signature

> **on**\<`K`\>(`event`): [`EventSubscription`](Interface.EventSubscription.md)\<[`EventMap`](Interface.EventMap.md)\<`T`\>\[`K`\]\>

Defined in: [api/events/public.ts:101](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/events/public.ts#L101)

Subscribe to a map event.

Common names: 'load' | 'resize' | 'move' | 'moveend' | 'zoom' | 'zoomend' | 'pointerdown' | 'pointermove' | 'pointerup' | 'mousedown' | 'mousemove' | 'mouseup' | 'click' | 'dblclick' | 'contextmenu' | 'frame' | 'markerenter' | 'markerleave' | 'markerclick' | 'markerdown' | 'markerup' | 'markerlongpress'

##### Type Parameters

###### K

`K` *extends* `"moveend"` \| `"zoomend"` \| `"click"` \| `"pointerdown"` \| `"pointerup"` \| `"load"` \| `"resize"` \| `"move"` \| `"zoom"` \| `"pointermove"` \| `"frame"` \| `"markerenter"` \| `"markerleave"` \| `"markerclick"` \| `"markerdown"` \| `"markerup"` \| `"markerlongpress"` \| `"mousedown"` \| `"mousemove"` \| `"mouseup"` \| `"dblclick"` \| `"contextmenu"`

##### Parameters

###### event

`K`

##### Returns

[`EventSubscription`](Interface.EventSubscription.md)\<[`EventMap`](Interface.EventMap.md)\<`T`\>\[`K`\]\>

##### Overrides

[`PublicEvents`](Interface.PublicEvents.md).[`on`](Interface.PublicEvents.md#on)

#### Call Signature

> **on**\<`K`\>(`event`, `handler`): [`Unsubscribe`](TypeAlias.Unsubscribe.md)

Defined in: [api/events/public.ts:102](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/events/public.ts#L102)

Subscribe to a named event.

##### Type Parameters

###### K

`K` *extends* `"moveend"` \| `"zoomend"` \| `"click"` \| `"pointerdown"` \| `"pointerup"` \| `"load"` \| `"resize"` \| `"move"` \| `"zoom"` \| `"pointermove"` \| `"frame"` \| `"markerenter"` \| `"markerleave"` \| `"markerclick"` \| `"markerdown"` \| `"markerup"` \| `"markerlongpress"` \| `"mousedown"` \| `"mousemove"` \| `"mouseup"` \| `"dblclick"` \| `"contextmenu"`

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

> **once**\<`K`\>(`event`): `Promise`\<[`EventMap`](Interface.EventMap.md)\<`T`\>\[`K`\]\>

Defined in: [api/events/public.ts:52](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/api/events/public.ts#L52)

Wait for the next event occurrence and resolve with its payload.

#### Type Parameters

##### K

`K` *extends* `"moveend"` \| `"zoomend"` \| `"click"` \| `"pointerdown"` \| `"pointerup"` \| `"load"` \| `"resize"` \| `"move"` \| `"zoom"` \| `"pointermove"` \| `"frame"` \| `"markerenter"` \| `"markerleave"` \| `"markerclick"` \| `"markerdown"` \| `"markerup"` \| `"markerlongpress"` \| `"mousedown"` \| `"mousemove"` \| `"mouseup"` \| `"dblclick"` \| `"contextmenu"`

#### Parameters

##### event

`K`

Event name (typed)

#### Returns

`Promise`\<[`EventMap`](Interface.EventMap.md)\<`T`\>\[`K`\]\>

Promise that resolves with the payload of the next event.

#### Example

```ts
await marker.events.once('remove');
```

#### Inherited from

[`PublicEvents`](Interface.PublicEvents.md).[`once`](Interface.PublicEvents.md#once)
