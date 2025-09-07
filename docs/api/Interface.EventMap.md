[**@gaming.tools/gtmap**](README.md)

***

# Interface: EventMap\<TMarkerData\>

[← Back to API index](./README.md)

## Contents

- [Type Parameters](#type-parameters)
  - [TMarkerData](#tmarkerdata)
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

Defined in: [api/types.ts:253](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L253)

## Type Parameters

### TMarkerData

`TMarkerData` = `unknown`

## Properties

### click

> **click**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:293](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L293)

Mouse click (derived from pointer).

***

### contextmenu

> **contextmenu**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:297](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L297)

Context menu (derived).

***

### dblclick

> **dblclick**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:295](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L295)

Double‑click (derived).

***

### frame

> **frame**: [`FrameEventData`](Interface.FrameEventData.md)

Defined in: [api/types.ts:273](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L273)

Per‑frame hook with optional stats (HUD/diagnostics).

***

### load

> **load**: [`LoadEventData`](Interface.LoadEventData.md)

Defined in: [api/types.ts:255](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L255)

Fired once after the first frame is scheduled.

***

### markerclick

> **markerclick**: [`MarkerEventData`](Interface.MarkerEventData.md)\<`TMarkerData`\>

Defined in: [api/types.ts:279](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L279)

Marker click (device‑agnostic).

***

### markerdown

> **markerdown**: [`MarkerEventData`](Interface.MarkerEventData.md)\<`TMarkerData`\>

Defined in: [api/types.ts:281](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L281)

Marker pointer down.

***

### markerenter

> **markerenter**: [`MarkerEventData`](Interface.MarkerEventData.md)\<`TMarkerData`\>

Defined in: [api/types.ts:275](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L275)

Marker hover enter (top‑most).

***

### markerleave

> **markerleave**: [`MarkerEventData`](Interface.MarkerEventData.md)\<`TMarkerData`\>

Defined in: [api/types.ts:277](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L277)

Marker hover leave.

***

### markerlongpress

> **markerlongpress**: [`MarkerEventData`](Interface.MarkerEventData.md)\<`TMarkerData`\>

Defined in: [api/types.ts:285](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L285)

Marker long‑press (~500ms).

***

### markerup

> **markerup**: [`MarkerEventData`](Interface.MarkerEventData.md)\<`TMarkerData`\>

Defined in: [api/types.ts:283](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L283)

Marker pointer up.

***

### mousedown

> **mousedown**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:287](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L287)

Mouse down (derived from pointer).

***

### mousemove

> **mousemove**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:289](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L289)

Mouse move (derived from pointer); may include `markers?` hover hits.

***

### mouseup

> **mouseup**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:291](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L291)

Mouse up (derived from pointer).

***

### move

> **move**: [`MoveEventData`](Interface.MoveEventData.md)

Defined in: [api/types.ts:259](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L259)

Continuous movement (center changed).

***

### moveend

> **moveend**: [`MoveEventData`](Interface.MoveEventData.md)

Defined in: [api/types.ts:261](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L261)

Movement ended (center settled).

***

### pointerdown

> **pointerdown**: [`PointerEventData`](Interface.PointerEventData.md)

Defined in: [api/types.ts:267](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L267)

Pointer pressed on the map.

***

### pointermove

> **pointermove**: [`PointerEventData`](Interface.PointerEventData.md)

Defined in: [api/types.ts:269](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L269)

Pointer moved over the map.

***

### pointerup

> **pointerup**: [`PointerEventData`](Interface.PointerEventData.md)

Defined in: [api/types.ts:271](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L271)

Pointer released on the map.

***

### resize

> **resize**: [`ResizeEventData`](Interface.ResizeEventData.md)

Defined in: [api/types.ts:257](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L257)

Fired after a debounced resize completes with final size + DPR.

***

### zoom

> **zoom**: [`ZoomEventData`](Interface.ZoomEventData.md)

Defined in: [api/types.ts:263](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L263)

Continuous zoom changes.

***

### zoomend

> **zoomend**: [`ZoomEventData`](Interface.ZoomEventData.md)

Defined in: [api/types.ts:265](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L265)

Zoom ended (zoom settled).
