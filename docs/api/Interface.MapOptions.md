[**@gaming.tools/gtmap**](README.md)

***

# Interface: MapOptions

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [autoResize?](#autoresize)
  - [backgroundColor?](#backgroundcolor)
  - [bounceAtZoomLimits?](#bounceatzoomlimits)
  - [center?](#center)
  - [fpsCap?](#fpscap)
  - [freePan?](#freepan)
  - [image](#image)
  - [maxBoundsPx?](#maxboundspx)
  - [maxBoundsViscosity?](#maxboundsviscosity)
  - [maxZoom?](#maxzoom)
  - [minZoom?](#minzoom)
  - [preview?](#preview)
  - [screenCache?](#screencache)
  - [spinner?](#spinner)
  - [wrapX?](#wrapx)
  - [zoom?](#zoom)

Defined in: [api/types.ts:32](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L32)

## Properties

### autoResize?

> `optional` **autoResize**: `boolean`

Defined in: [api/types.ts:51](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L51)

Automatically resize the map when the container size or window DPR changes.
Enabled by default.

***

### backgroundColor?

> `optional` **backgroundColor**: `string` \| \{ `a?`: `number`; `b`: `number`; `g`: `number`; `r`: `number`; \}

Defined in: [api/types.ts:56](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L56)

Viewport background: either 'transparent' (default when omitted) or a solid color.
Alpha on provided colors is ignored; pass a hex like '#0a0a0a' or RGB components.

***

### bounceAtZoomLimits?

> `optional` **bounceAtZoomLimits**: `boolean`

Defined in: [api/types.ts:67](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L67)

When true, allow a small elastic bounce at zoom limits (visual easing only).
Defaults to false.

***

### center?

> `optional` **center**: [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:45](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L45)

***

### fpsCap?

> `optional` **fpsCap**: `number`

Defined in: [api/types.ts:58](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L58)

***

### freePan?

> `optional` **freePan**: `boolean`

Defined in: [api/types.ts:60](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L60)

***

### image

> **image**: [`ImageSourceOptions`](Interface.ImageSourceOptions.md)

Defined in: [api/types.ts:34](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L34)

Single raster image to display (full resolution).

***

### maxBoundsPx?

> `optional` **maxBoundsPx**: `null` \| \{ `maxX`: `number`; `maxY`: `number`; `minX`: `number`; `minY`: `number`; \}

Defined in: [api/types.ts:61](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L61)

***

### maxBoundsViscosity?

> `optional` **maxBoundsViscosity**: `number`

Defined in: [api/types.ts:62](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L62)

***

### maxZoom?

> `optional` **maxZoom**: `number`

Defined in: [api/types.ts:44](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L44)

***

### minZoom?

> `optional` **minZoom**: `number`

Defined in: [api/types.ts:43](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L43)

***

### preview?

> `optional` **preview**: [`ImageSourceOptions`](Interface.ImageSourceOptions.md)

Defined in: [api/types.ts:42](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L42)

Optional low‑resolution preview to render first, then seamlessly upgrade to [MapOptions.image](#image).

When provided, the map shows the preview as soon as it is decoded and uploaded, then loads the
full‑resolution image in the background and swaps textures atomically without blocking interaction.
The preview is scaled to the full image dimensions so the swap is visually seamless (only quality improves).

***

### screenCache?

> `optional` **screenCache**: `boolean`

Defined in: [api/types.ts:57](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L57)

***

### spinner?

> `optional` **spinner**: [`SpinnerOptions`](Interface.SpinnerOptions.md)

Defined in: [api/types.ts:77](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L77)

Spinner appearance while loading the full image.

- size: outer diameter in CSS pixels (default 32)
- thickness: ring thickness in CSS pixels (default 3)
- color: active arc color (default 'rgba(0,0,0,0.6)')
- trackColor: background ring color (default 'rgba(0,0,0,0.2)')
- speedMs: rotation period in milliseconds (default 1000)

***

### wrapX?

> `optional` **wrapX**: `boolean`

Defined in: [api/types.ts:59](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L59)

***

### zoom?

> `optional` **zoom**: `number`

Defined in: [api/types.ts:46](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L46)
