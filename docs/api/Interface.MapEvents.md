[**@gaming.tools/gtmap**](README.md)

***

# Interface: MapEvents

Defined in: [api/events/public.ts:87](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/events/public.ts#L87)

Map events surface with typed names and payloads.

## Extends

- [`PublicEvents`](Interface.PublicEvents.md)\<`MapEventMap`\>

## Methods

### on()

#### Call Signature

> **on**\<`K`\>(`event`): [`EventSubscription`](Interface.EventSubscription.md)\<`EventMap`\[`K`\]\>

Defined in: [api/events/public.ts:93](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/events/public.ts#L93)

Subscribe to a map event.

Common names: 'load' | 'resize' | 'move' | 'moveend' | 'zoom' | 'zoomend' | 'pointerdown' | 'pointermove' | 'pointerup' | 'mousedown' | 'mousemove' | 'mouseup' | 'click' | 'dblclick' | 'contextmenu' | 'frame' | 'markerenter' | 'markerleave' | 'markerclick' | 'markerdown' | 'markerup' | 'markerlongpress'

##### Type Parameters

###### K

`K` *extends* `"click"` \| `"load"` \| `"resize"` \| `"move"` \| `"moveend"` \| `"zoom"` \| `"zoomend"` \| `"pointerdown"` \| `"pointermove"` \| `"pointerup"` \| `"frame"` \| `"markerenter"` \| `"markerleave"` \| `"markerclick"` \| `"markerdown"` \| `"markerup"` \| `"markerlongpress"` \| `"mousedown"` \| `"mousemove"` \| `"mouseup"` \| `"dblclick"` \| `"contextmenu"`

##### Parameters

###### event

`K`

##### Returns

[`EventSubscription`](Interface.EventSubscription.md)\<`EventMap`\[`K`\]\>

##### Overrides

[`PublicEvents`](Interface.PublicEvents.md).[`on`](Interface.PublicEvents.md#on)

#### Call Signature

> **on**\<`K`\>(`event`, `handler`): `Unsubscribe`

Defined in: [api/events/public.ts:94](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/events/public.ts#L94)

Subscribe to a named event.

##### Type Parameters

###### K

`K` *extends* `"click"` \| `"load"` \| `"resize"` \| `"move"` \| `"moveend"` \| `"zoom"` \| `"zoomend"` \| `"pointerdown"` \| `"pointermove"` \| `"pointerup"` \| `"frame"` \| `"markerenter"` \| `"markerleave"` \| `"markerclick"` \| `"markerdown"` \| `"markerup"` \| `"markerlongpress"` \| `"mousedown"` \| `"mousemove"` \| `"mouseup"` \| `"dblclick"` \| `"contextmenu"`

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

> **once**\<`K`\>(`event`): `Promise`\<`EventMap`\[`K`\]\>

Defined in: [api/events/public.ts:52](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/events/public.ts#L52)

Wait for the next event occurrence and resolve with its payload.

#### Type Parameters

##### K

`K` *extends* `"click"` \| `"load"` \| `"resize"` \| `"move"` \| `"moveend"` \| `"zoom"` \| `"zoomend"` \| `"pointerdown"` \| `"pointermove"` \| `"pointerup"` \| `"frame"` \| `"markerenter"` \| `"markerleave"` \| `"markerclick"` \| `"markerdown"` \| `"markerup"` \| `"markerlongpress"` \| `"mousedown"` \| `"mousemove"` \| `"mouseup"` \| `"dblclick"` \| `"contextmenu"`

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

#### Inherited from

[`PublicEvents`](Interface.PublicEvents.md).[`once`](Interface.PublicEvents.md#once)
