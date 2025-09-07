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

Defined in: [api/types.ts:248](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L248)

## Properties

### click

> **click**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:288](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L288)

Mouse click (derived from pointer).

***

### contextmenu

> **contextmenu**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:292](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L292)

Context menu (derived).

***

### dblclick

> **dblclick**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:290](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L290)

Double‑click (derived).

***

### frame

> **frame**: [`FrameEventData`](Interface.FrameEventData.md)

Defined in: [api/types.ts:268](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L268)

Per‑frame hook with optional stats (HUD/diagnostics).

***

### load

> **load**: [`LoadEventData`](Interface.LoadEventData.md)

Defined in: [api/types.ts:250](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L250)

Fired once after the first frame is scheduled.

***

### markerclick

> **markerclick**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:274](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L274)

Marker click (device‑agnostic).

***

### markerdown

> **markerdown**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:276](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L276)

Marker pointer down.

***

### markerenter

> **markerenter**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:270](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L270)

Marker hover enter (top‑most).

***

### markerleave

> **markerleave**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:272](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L272)

Marker hover leave.

***

### markerlongpress

> **markerlongpress**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:280](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L280)

Marker long‑press (~500ms).

***

### markerup

> **markerup**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:278](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L278)

Marker pointer up.

***

### mousedown

> **mousedown**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:282](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L282)

Mouse down (derived from pointer).

***

### mousemove

> **mousemove**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:284](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L284)

Mouse move (derived from pointer); may include `markers?` hover hits.

***

### mouseup

> **mouseup**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:286](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L286)

Mouse up (derived from pointer).

***

### move

> **move**: [`MoveEventData`](Interface.MoveEventData.md)

Defined in: [api/types.ts:254](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L254)

Continuous movement (center changed).

***

### moveend

> **moveend**: [`MoveEventData`](Interface.MoveEventData.md)

Defined in: [api/types.ts:256](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L256)

Movement ended (center settled).

***

### pointerdown

> **pointerdown**: [`PointerEventData`](Interface.PointerEventData.md)

Defined in: [api/types.ts:262](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L262)

Pointer pressed on the map.

***

### pointermove

> **pointermove**: [`PointerEventData`](Interface.PointerEventData.md)

Defined in: [api/types.ts:264](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L264)

Pointer moved over the map.

***

### pointerup

> **pointerup**: [`PointerEventData`](Interface.PointerEventData.md)

Defined in: [api/types.ts:266](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L266)

Pointer released on the map.

***

### resize

> **resize**: [`ResizeEventData`](Interface.ResizeEventData.md)

Defined in: [api/types.ts:252](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L252)

Fired after a debounced resize completes with final size + DPR.

***

### zoom

> **zoom**: [`ZoomEventData`](Interface.ZoomEventData.md)

Defined in: [api/types.ts:258](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L258)

Continuous zoom changes.

***

### zoomend

> **zoomend**: [`ZoomEventData`](Interface.ZoomEventData.md)

Defined in: [api/types.ts:260](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/types.ts#L260)

Zoom ended (zoom settled).
