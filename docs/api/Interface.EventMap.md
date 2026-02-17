[**@gaming.tools/gtmap**](README.md)

***

# Interface: EventMap

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [click](#click)
  - [contextmenu](#contextmenu)
  - [dblclick](#dblclick)
  - [frame](#frame)
  - [load](#load)
  - [markerclick](#markerclick)
  - [markerdown](#markerdown)
  - [markerenter](#markerenter)
  - [markerleave](#markerleave)
  - [markerlongpress](#markerlongpress)
  - [markerup](#markerup)
  - [mousedown](#mousedown)
  - [mousemove](#mousemove)
  - [mouseup](#mouseup)
  - [move](#move)
  - [moveend](#moveend)
  - [pointerdown](#pointerdown)
  - [pointermove](#pointermove)
  - [pointerup](#pointerup)
  - [resize](#resize)
  - [zoom](#zoom)
  - [zoomend](#zoomend)

Defined in: [api/types.ts:280](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L280)

## Properties

### click

> **click**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:320](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L320)

Mouse click (derived from pointer).

***

### contextmenu

> **contextmenu**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:324](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L324)

Context menu (derived).

***

### dblclick

> **dblclick**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:322](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L322)

Double‑click (derived).

***

### frame

> **frame**: [`FrameEventData`](Interface.FrameEventData.md)

Defined in: [api/types.ts:300](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L300)

Per‑frame hook with optional stats (HUD/diagnostics).

***

### load

> **load**: [`LoadEventData`](Interface.LoadEventData.md)

Defined in: [api/types.ts:282](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L282)

Fired once after the first frame is scheduled.

***

### markerclick

> **markerclick**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:306](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L306)

Marker click (device‑agnostic).

***

### markerdown

> **markerdown**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:308](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L308)

Marker pointer down.

***

### markerenter

> **markerenter**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:302](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L302)

Marker hover enter (top‑most).

***

### markerleave

> **markerleave**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:304](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L304)

Marker hover leave.

***

### markerlongpress

> **markerlongpress**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:312](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L312)

Marker long‑press (~500ms).

***

### markerup

> **markerup**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:310](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L310)

Marker pointer up.

***

### mousedown

> **mousedown**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:314](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L314)

Mouse down (derived from pointer).

***

### mousemove

> **mousemove**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:316](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L316)

Mouse move (derived from pointer); may include `markers?` hover hits.

***

### mouseup

> **mouseup**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:318](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L318)

Mouse up (derived from pointer).

***

### move

> **move**: [`MoveEventData`](Interface.MoveEventData.md)

Defined in: [api/types.ts:286](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L286)

Continuous movement (center changed).

***

### moveend

> **moveend**: [`MoveEventData`](Interface.MoveEventData.md)

Defined in: [api/types.ts:288](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L288)

Movement ended (center settled).

***

### pointerdown

> **pointerdown**: [`PointerEventData`](Interface.PointerEventData.md)

Defined in: [api/types.ts:294](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L294)

Pointer pressed on the map.

***

### pointermove

> **pointermove**: [`PointerEventData`](Interface.PointerEventData.md)

Defined in: [api/types.ts:296](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L296)

Pointer moved over the map.

***

### pointerup

> **pointerup**: [`PointerEventData`](Interface.PointerEventData.md)

Defined in: [api/types.ts:298](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L298)

Pointer released on the map.

***

### resize

> **resize**: [`ResizeEventData`](Interface.ResizeEventData.md)

Defined in: [api/types.ts:284](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L284)

Fired after a debounced resize completes with final size + DPR.

***

### zoom

> **zoom**: [`ZoomEventData`](Interface.ZoomEventData.md)

Defined in: [api/types.ts:290](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L290)

Continuous zoom changes.

***

### zoomend

> **zoomend**: [`ZoomEventData`](Interface.ZoomEventData.md)

Defined in: [api/types.ts:292](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L292)

Zoom ended (zoom settled).
