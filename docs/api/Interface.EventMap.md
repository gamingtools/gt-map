[**@gaming.tools/gtmap**](README.md)

***

# Interface: EventMap

Defined in: [api/types.ts:289](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L289)

## Properties

### click

> **click**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:329](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L329)

Mouse click (derived from pointer).

***

### contextmenu

> **contextmenu**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:333](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L333)

Context menu (derived).

***

### dblclick

> **dblclick**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:331](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L331)

Double‑click (derived).

***

### frame

> **frame**: [`FrameEventData`](Interface.FrameEventData.md)

Defined in: [api/types.ts:309](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L309)

Per‑frame hook with optional stats (HUD/diagnostics).

***

### load

> **load**: [`LoadEventData`](Interface.LoadEventData.md)

Defined in: [api/types.ts:291](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L291)

Fired once after the first frame is scheduled.

***

### markerclick

> **markerclick**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:315](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L315)

Marker click (device‑agnostic).

***

### markerdown

> **markerdown**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:317](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L317)

Marker pointer down.

***

### markerenter

> **markerenter**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:311](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L311)

Marker hover enter (top‑most).

***

### markerleave

> **markerleave**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:313](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L313)

Marker hover leave.

***

### markerlongpress

> **markerlongpress**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:321](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L321)

Marker long‑press (~500ms).

***

### markerup

> **markerup**: [`MarkerEventData`](Interface.MarkerEventData.md)

Defined in: [api/types.ts:319](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L319)

Marker pointer up.

***

### mousedown

> **mousedown**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:323](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L323)

Mouse down (derived from pointer).

***

### mousemove

> **mousemove**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:325](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L325)

Mouse move (derived from pointer); may include `markers?` hover hits.

***

### mouseup

> **mouseup**: [`MouseEventData`](Interface.MouseEventData.md)

Defined in: [api/types.ts:327](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L327)

Mouse up (derived from pointer).

***

### move

> **move**: [`MoveEventData`](Interface.MoveEventData.md)

Defined in: [api/types.ts:295](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L295)

Continuous movement (center changed).

***

### moveend

> **moveend**: [`MoveEventData`](Interface.MoveEventData.md)

Defined in: [api/types.ts:297](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L297)

Movement ended (center settled).

***

### pointerdown

> **pointerdown**: [`PointerEventData`](Interface.PointerEventData.md)

Defined in: [api/types.ts:303](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L303)

Pointer pressed on the map.

***

### pointermove

> **pointermove**: [`PointerEventData`](Interface.PointerEventData.md)

Defined in: [api/types.ts:305](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L305)

Pointer moved over the map.

***

### pointerup

> **pointerup**: [`PointerEventData`](Interface.PointerEventData.md)

Defined in: [api/types.ts:307](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L307)

Pointer released on the map.

***

### resize

> **resize**: [`ResizeEventData`](Interface.ResizeEventData.md)

Defined in: [api/types.ts:293](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L293)

Fired after a debounced resize completes with final size + DPR.

***

### zoom

> **zoom**: [`ZoomEventData`](Interface.ZoomEventData.md)

Defined in: [api/types.ts:299](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L299)

Continuous zoom changes.

***

### zoomend

> **zoomend**: [`ZoomEventData`](Interface.ZoomEventData.md)

Defined in: [api/types.ts:301](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L301)

Zoom ended (zoom settled).
