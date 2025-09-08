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
  - [getRotation()](#getrotation)
  - [getZoom()](#getzoom)
  - [invalidateSize()](#invalidatesize)
  - [setAutoResize()](#setautoresize)
  - [setFpsCap()](#setfpscap)
  - [setRotation()](#setrotation)
  - [transition()](#transition)

Defined in: [api/Map.ts:61](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L61)

## Type Parameters

### TMarkerData

`TMarkerData` = `unknown`

## Accessors

### pointerAbs

#### Get Signature

> **get** **pointerAbs**(): `null` \| \{ `x`: `number`; `y`: `number`; \}

Defined in: [api/Map.ts:519](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L519)

Get the last pointer position in world pixels.

##### Returns

`null` \| \{ `x`: `number`; `y`: `number`; \}

Position or `null` if outside the map

## Methods

### addVectors()

> **addVectors**(`_vectors`): `this`

Defined in: [api/Map.ts:422](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L422)

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

Defined in: [api/Map.ts:334](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L334)

Destroy the map instance and release all resources.

#### Returns

`void`

***

### setActive()

> **setActive**(`on`, `opts?`): `this`

Defined in: [api/Map.ts:325](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L325)

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

Defined in: [api/Map.ts:305](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L305)

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

Defined in: [api/Map.ts:536](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L536)

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

Defined in: [api/Map.ts:74](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L74)

***

### vectors

> `readonly` **vectors**: [`Layer`](Class.Layer.md)\<[`VectorEntity`](Class.VectorEntity.md)\>

Defined in: [api/Map.ts:86](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L86)

***

### addIcon()

> **addIcon**(`def`, `id?`): [`IconHandle`](Interface.IconHandle.md)

Defined in: [api/Map.ts:369](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L369)

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

Defined in: [api/Map.ts:405](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L405)

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

Defined in: [api/Map.ts:451](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L451)

#### Parameters

##### geometry

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

#### Returns

[`VectorEntity`](Class.VectorEntity.md)

***

### clearMarkers()

> **clearMarkers**(): `this`

Defined in: [api/Map.ts:469](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L469)

#### Returns

`this`

***

### clearVectors()

> **clearVectors**(): `this`

Defined in: [api/Map.ts:485](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L485)

#### Returns

`this`

## Events

### events

#### Get Signature

> **get** **events**(): [`MapEvents`](Interface.MapEvents.md)\<`TMarkerData`\>

Defined in: [api/Map.ts:716](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L716)

##### Returns

[`MapEvents`](Interface.MapEvents.md)\<`TMarkerData`\>

## Lifecycle

### Constructor

> **new GTMap**\<`TMarkerData`\>(`container`, `options`): `GTMap`\<`TMarkerData`\>

Defined in: [api/Map.ts:109](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L109)

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

Defined in: [api/Map.ts:618](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L618)

#### Parameters

##### color

`string` | \{ `a?`: `number`; `b`: `number`; `g`: `number`; `r`: `number`; \}

#### Returns

`this`

***

### setGridVisible()

> **setGridVisible**(`on`): `this`

Defined in: [api/Map.ts:268](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L268)

#### Parameters

##### on

`boolean`

#### Returns

`this`

***

### setMaxBoundsPx()

> **setMaxBoundsPx**(`bounds`): `this`

Defined in: [api/Map.ts:566](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L566)

Constrain panning to pixel bounds (Leaflet‑like). Pass `null` to clear.

#### Parameters

##### bounds

`{ minX, minY, maxX, maxY }` in world pixels, or `null` to remove constraints

`null` | [`MaxBoundsPx`](Interface.MaxBoundsPx.md)

#### Returns

`this`

This map instance for chaining

#### Remarks

When set, zoom‑out is also clamped so the given bounds always cover the viewport.

***

### setMaxBoundsViscosity()

> **setMaxBoundsViscosity**(`v`): `this`

Defined in: [api/Map.ts:579](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L579)

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

Defined in: [api/Map.ts:287](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L287)

#### Parameters

##### mode

`"auto"` | `"linear"` | `"bicubic"`

#### Returns

`this`

***

### setWrapX()

> **setWrapX**(`on`): `this`

Defined in: [api/Map.ts:551](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L551)

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

Defined in: [api/Map.ts:499](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L499)

#### Returns

[`Point`](TypeAlias.Point.md)

***

### getRotation()

> **getRotation**(): `number`

Defined in: [api/Map.ts:769](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L769)

#### Returns

`number`

***

### getZoom()

> **getZoom**(): `number`

Defined in: [api/Map.ts:510](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L510)

#### Returns

`number`

***

### invalidateSize()

> **invalidateSize**(): `this`

Defined in: [api/Map.ts:688](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L688)

#### Returns

`this`

***

### setAutoResize()

> **setAutoResize**(`on`): `this`

Defined in: [api/Map.ts:637](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L637)

#### Parameters

##### on

`boolean`

#### Returns

`this`

***

### setFpsCap()

> **setFpsCap**(`v`): `this`

Defined in: [api/Map.ts:598](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L598)

#### Parameters

##### v

`number`

#### Returns

`this`

***

### setRotation()

> **setRotation**(`deg`, `opts?`): `this`

Defined in: [api/Map.ts:754](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L754)

#### Parameters

##### deg

`number`

##### opts?

###### markerRotationMode?

[`MarkerRotationMode`](TypeAlias.MarkerRotationMode.md)

#### Returns

`this`

***

### transition()

> **transition**(): [`ViewTransition`](Interface.ViewTransition.md)

Defined in: [api/Map.ts:734](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L734)

#### Returns

[`ViewTransition`](Interface.ViewTransition.md)
