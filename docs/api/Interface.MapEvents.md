[**@gaming.tools/gtmap**](README.md)

***

# Interface: MapEvents

[← Back to API index](./README.md)

## Contents

- [Extends](#extends)
- [Methods](#methods)
  - [on()](#on)
  - [once()](#once)

Defined in: [api/events/public.ts:88](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/public.ts#L88)

Map events surface with typed names and payloads.

## Extends

- [`PublicEvents`](Interface.PublicEvents.md)\<[`EventMap`](Interface.EventMap.md)\>

## Methods

### on()

#### Call Signature

> **on**\<`K`\>(`event`): [`EventSubscription`](Interface.EventSubscription.md)\<[`EventMap`](Interface.EventMap.md)\[`K`\]\>

Defined in: [api/events/public.ts:94](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/public.ts#L94)

Subscribe to a map event.

Common names: 'load' | 'resize' | 'move' | 'moveend' | 'zoom' | 'zoomend' | 'pointerdown' | 'pointermove' | 'pointerup' | 'mousedown' | 'mousemove' | 'mouseup' | 'click' | 'dblclick' | 'contextmenu' | 'frame' | 'markerenter' | 'markerleave' | 'markerclick' | 'markerdown' | 'markerup' | 'markerlongpress'

##### Type Parameters

###### K

`K` *extends* `"click"` \| `"pointerdown"` \| `"pointerup"` \| `"load"` \| `"resize"` \| `"move"` \| `"moveend"` \| `"zoom"` \| `"zoomend"` \| `"pointermove"` \| `"frame"` \| `"markerenter"` \| `"markerleave"` \| `"markerclick"` \| `"markerdown"` \| `"markerup"` \| `"markerlongpress"` \| `"mousedown"` \| `"mousemove"` \| `"mouseup"` \| `"dblclick"` \| `"contextmenu"`

##### Parameters

###### event

`K`

##### Returns

[`EventSubscription`](Interface.EventSubscription.md)\<[`EventMap`](Interface.EventMap.md)\[`K`\]\>

##### Overrides

[`PublicEvents`](Interface.PublicEvents.md).[`on`](Interface.PublicEvents.md#on)

#### Call Signature

> **on**\<`K`\>(`event`, `handler`): [`Unsubscribe`](TypeAlias.Unsubscribe.md)

Defined in: [api/events/public.ts:95](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/public.ts#L95)

Subscribe to a named event.

##### Type Parameters

###### K

`K` *extends* `"click"` \| `"pointerdown"` \| `"pointerup"` \| `"load"` \| `"resize"` \| `"move"` \| `"moveend"` \| `"zoom"` \| `"zoomend"` \| `"pointermove"` \| `"frame"` \| `"markerenter"` \| `"markerleave"` \| `"markerclick"` \| `"markerdown"` \| `"markerup"` \| `"markerlongpress"` \| `"mousedown"` \| `"mousemove"` \| `"mouseup"` \| `"dblclick"` \| `"contextmenu"`

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

> **once**\<`K`\>(`event`): `Promise`\<[`EventMap`](Interface.EventMap.md)\[`K`\]\>

Defined in: [api/events/public.ts:52](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/events/public.ts#L52)

Wait for the next event occurrence and resolve with its payload.

#### Type Parameters

##### K

`K` *extends* `"click"` \| `"pointerdown"` \| `"pointerup"` \| `"load"` \| `"resize"` \| `"move"` \| `"moveend"` \| `"zoom"` \| `"zoomend"` \| `"pointermove"` \| `"frame"` \| `"markerenter"` \| `"markerleave"` \| `"markerclick"` \| `"markerdown"` \| `"markerup"` \| `"markerlongpress"` \| `"mousedown"` \| `"mousemove"` \| `"mouseup"` \| `"dblclick"` \| `"contextmenu"`

#### Parameters

##### event

`K`

Event name (typed)

#### Returns

`Promise`\<[`EventMap`](Interface.EventMap.md)\[`K`\]\>

Promise that resolves with the payload of the next event.

#### Example

```ts
await marker.events.once('remove');
```

#### Inherited from

[`PublicEvents`](Interface.PublicEvents.md).[`once`](Interface.PublicEvents.md#once)
