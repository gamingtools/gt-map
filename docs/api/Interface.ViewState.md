[**@gaming.tools/gtmap**](README.md)

***

# Interface: ViewState

Defined in: [api/types.ts:13](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L13)

Snapshot of the current view state, included in most event payloads.

## Properties

### center

> **center**: [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:15](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L15)

Center of the viewport in world pixels.

***

### maxZoom

> **maxZoom**: `number`

Defined in: [api/types.ts:21](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L21)

Maximum allowed zoom.

***

### minZoom

> **minZoom**: `number`

Defined in: [api/types.ts:19](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L19)

Minimum allowed zoom.

***

### wrapX

> **wrapX**: `boolean`

Defined in: [api/types.ts:23](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L23)

Whether horizontal wrapping is enabled.

***

### zoom

> **zoom**: `number`

Defined in: [api/types.ts:17](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L17)

Current zoom level.
