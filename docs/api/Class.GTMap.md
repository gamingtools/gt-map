[**@gaming.tools/gtmap**](README.md)

***

# Class: GTMap\<TMarkerData\>

[← Back to API index](./README.md)

## Contents

- [Type Parameters](#type-parameters)
  - [TMarkerData](#tmarkerdata)
- [Accessors](#accessors)
  - [pointerAbs](#pointerabs)
- [Methods](#methods)
  - [addVectors()](#addvectors)
  - [destroy()](#destroy)
  - [setActive()](#setactive)
  - [setIconScaleFunction()](#seticonscalefunction)
  - [setWheelSpeed()](#setwheelspeed)
- [Content](#content)
  - [markers](#markers)
  - [vectors](#vectors)
  - [addIcon()](#addicon)
  - [addMarker()](#addmarker)
  - [addVector()](#addvector)
  - [clearMarkers()](#clearmarkers)
  - [clearVectors()](#clearvectors)
- [Events](#events)
  - [events](#events)
- [Lifecycle](#lifecycle)
  - [Constructor](#constructor)
- [Tiles & Styling](#tiles-styling)
  - [setBackgroundColor()](#setbackgroundcolor)
  - [setGridVisible()](#setgridvisible)
  - [setMaxBoundsPx()](#setmaxboundspx)
  - [setMaxBoundsViscosity()](#setmaxboundsviscosity)
  - [setUpscaleFilter()](#setupscalefilter)
  - [setWrapX()](#setwrapx)
- [View](#view)
  - [getCenter()](#getcenter)
  - [getZoom()](#getzoom)
  - [invalidateSize()](#invalidatesize)
  - [setAutoResize()](#setautoresize)
  - [setFpsCap()](#setfpscap)
  - [transition()](#transition)

Defined in: [api/Map.ts:58](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L58)

## Type Parameters

### TMarkerData

`TMarkerData` = `unknown`

## Accessors

### pointerAbs

#### Get Signature

> **get** **pointerAbs**(): `null` \| \{ `x`: `number`; `y`: `number`; \}

Defined in: [api/Map.ts:471](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L471)

Get the last pointer position in world pixels.

##### Returns

`null` \| \{ `x`: `number`; `y`: `number`; \}

Position or `null` if outside the map

## Methods

### addVectors()

> **addVectors**(`_vectors`): `this`

Defined in: [api/Map.ts:384](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L384)

Add legacy vector primitives in a single batch (temporary helper).
Prefer `addVector(geometry)` for the entity-based API.

#### Parameters

##### \_vectors

[`Vector`](TypeAlias.Vector.md)[]

#### Returns

`this`

***

### destroy()

> **destroy**(): `void`

Defined in: [api/Map.ts:296](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L296)

Destroy the map instance and release all resources.

#### Returns

`void`

***

### setActive()

> **setActive**(`on`, `opts?`): `this`

Defined in: [api/Map.ts:287](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L287)

Suspend or resume the map.

#### Parameters

##### on

`boolean`

`true` to activate, `false` to suspend

##### opts?

[`ActiveOptions`](Interface.ActiveOptions.md)

Optional behavior

#### Returns

`this`

This map instance for chaining

#### Example

* ```ts
 * // Pause rendering and release VRAM, then resume later
 * map.setActive(false, { releaseGL: true });
 * map.setActive(true);
 * ```

***

### setIconScaleFunction()

> **setIconScaleFunction**(`fn`): `this`

Defined in: [api/Map.ts:267](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L267)

Set a custom function to control icon scaling vs. zoom.

#### Parameters

##### fn

Returns a scale multiplier, where `1` means screen‑fixed size

`null` | [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

#### Returns

`this`

This map instance for chaining

#### Example

* ```ts
 * // Make icons grow/shrink with zoom around Z=3
 * map.setIconScaleFunction((z) => Math.pow(2, z - 3));
 * ```

***

### setWheelSpeed()

> **setWheelSpeed**(`v`): `this`

Defined in: [api/Map.ts:488](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L488)

Set mouse‑wheel zoom speed.

#### Parameters

##### v

`number`

Speed multiplier (0.01–2.0)

#### Returns

`this`

This map instance for chaining
 *
 *

#### Example

* ```ts
 * // Wire to a range input for user control
 * const input = document.querySelector('#wheelSpeed') as HTMLInputElement;
 * input.oninput = () => map.setWheelSpeed(Number(input.value));
 * ```

## Content

### markers

> `readonly` **markers**: [`Layer`](Class.Layer.md)\<[`Marker`](Class.Marker.md)\<`TMarkerData`\>\>

Defined in: [api/Map.ts:68](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L68)

***

### vectors

> `readonly` **vectors**: [`Layer`](Class.Layer.md)\<[`VectorEntity`](Class.VectorEntity.md)\>

Defined in: [api/Map.ts:73](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L73)

***

### addIcon()

> **addIcon**(`def`, `id?`): [`IconHandle`](Interface.IconHandle.md)

Defined in: [api/Map.ts:331](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L331)

#### Parameters

##### def

[`IconDef`](Interface.IconDef.md)

##### id?

`string`

#### Returns

[`IconHandle`](Interface.IconHandle.md)

***

### addMarker()

> **addMarker**(`x`, `y`, `opts?`): [`Marker`](Class.Marker.md)\<`TMarkerData`\>

Defined in: [api/Map.ts:367](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L367)

#### Parameters

##### x

`number`

##### y

`number`

##### opts?

###### data?

`TMarkerData`

###### icon?

[`IconHandle`](Interface.IconHandle.md)

###### rotation?

`number`

###### size?

`number`

#### Returns

[`Marker`](Class.Marker.md)\<`TMarkerData`\>

***

### addVector()

> **addVector**(`geometry`): [`VectorEntity`](Class.VectorEntity.md)

Defined in: [api/Map.ts:413](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L413)

#### Parameters

##### geometry

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

#### Returns

[`VectorEntity`](Class.VectorEntity.md)

***

### clearMarkers()

> **clearMarkers**(): `this`

Defined in: [api/Map.ts:426](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L426)

#### Returns

`this`

***

### clearVectors()

> **clearVectors**(): `this`

Defined in: [api/Map.ts:437](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L437)

#### Returns

`this`

## Events

### events

#### Get Signature

> **get** **events**(): [`MapEvents`](Interface.MapEvents.md)\<`TMarkerData`\>

Defined in: [api/Map.ts:648](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L648)

##### Returns

[`MapEvents`](Interface.MapEvents.md)\<`TMarkerData`\>

## Lifecycle

### Constructor

> **new GTMap**\<`TMarkerData`\>(`container`, `options`): `GTMap`\<`TMarkerData`\>

Defined in: [api/Map.ts:95](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L95)

#### Parameters

##### container

`HTMLElement`

##### options

[`MapOptions`](Interface.MapOptions.md)

#### Returns

`GTMap`\<`TMarkerData`\>

## Tiles & Styling

### setBackgroundColor()

> **setBackgroundColor**(`color`): `this`

Defined in: [api/Map.ts:570](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L570)

#### Parameters

##### color

`string` | \{ `a?`: `number`; `b`: `number`; `g`: `number`; `r`: `number`; \}

#### Returns

`this`

***

### setGridVisible()

> **setGridVisible**(`on`): `this`

Defined in: [api/Map.ts:237](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L237)

#### Parameters

##### on

`boolean`

#### Returns

`this`

***

### setMaxBoundsPx()

> **setMaxBoundsPx**(`bounds`): `this`

Defined in: [api/Map.ts:518](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L518)

Constrain panning to pixel bounds (Leaflet‑like). Pass `null` to clear.

#### Parameters

##### bounds

`{ minX, minY, maxX, maxY }` in world pixels, or `null` to remove constraints

`null` | `MaxBoundsPx`

#### Returns

`this`

This map instance for chaining

#### Remarks

When set, zoom‑out is also clamped so the given bounds always cover the viewport.

***

### setMaxBoundsViscosity()

> **setMaxBoundsViscosity**(`v`): `this`

Defined in: [api/Map.ts:531](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L531)

Set bounds viscosity (0..1) for a resistive effect near the edges.

#### Parameters

##### v

`number`

Viscosity factor in [0..1]; `0` = hard clamp, `1` = very soft

#### Returns

`this`

This map instance for chaining

***

### setUpscaleFilter()

> **setUpscaleFilter**(`mode`): `this`

Defined in: [api/Map.ts:249](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L249)

#### Parameters

##### mode

`"auto"` | `"linear"` | `"bicubic"`

#### Returns

`this`

***

### setWrapX()

> **setWrapX**(`on`): `this`

Defined in: [api/Map.ts:503](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L503)

Enable or disable horizontal world wrap.

#### Parameters

##### on

`boolean`

`true` to allow infinite panning across X (wrap), `false` to clamp at image edges

#### Returns

`this`

This map instance for chaining

#### Remarks

Pixel CRS only: when wrapping is enabled, the world repeats seamlessly along X; Y is never wrapped.

## View

### getCenter()

> **getCenter**(): [`Point`](TypeAlias.Point.md)

Defined in: [api/Map.ts:451](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L451)

#### Returns

[`Point`](TypeAlias.Point.md)

***

### getZoom()

> **getZoom**(): `number`

Defined in: [api/Map.ts:462](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L462)

#### Returns

`number`

***

### invalidateSize()

> **invalidateSize**(): `this`

Defined in: [api/Map.ts:631](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L631)

#### Returns

`this`

***

### setAutoResize()

> **setAutoResize**(`on`): `this`

Defined in: [api/Map.ts:589](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L589)

#### Parameters

##### on

`boolean`

#### Returns

`this`

***

### setFpsCap()

> **setFpsCap**(`v`): `this`

Defined in: [api/Map.ts:550](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L550)

#### Parameters

##### v

`number`

#### Returns

`this`

***

### transition()

> **transition**(): [`ViewTransition`](Interface.ViewTransition.md)

Defined in: [api/Map.ts:668](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/Map.ts#L668)

#### Returns

[`ViewTransition`](Interface.ViewTransition.md)
