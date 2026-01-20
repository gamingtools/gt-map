[**@gaming.tools/gtmap**](README.md)

***

# Class: GTMap\<TMarkerData\>

[← Back to API index](./README.md)

## Contents

- [Type Parameters](#type-parameters)
  - [TMarkerData](#tmarkerdata)
- [Methods](#methods)
  - [destroy()](#destroy)
  - [setCoordBounds()](#setcoordbounds)
  - [setIconScaleFunction()](#seticonscalefunction)
  - [setWheelSpeed()](#setwheelspeed)
  - [translate()](#translate)
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
  - [resume()](#resume)
  - [suspend()](#suspend)
- [Tiles & Styling](#tiles-styling)
  - [setBackgroundColor()](#setbackgroundcolor)
  - [setGridVisible()](#setgridvisible)
  - [setMaxBoundsPx()](#setmaxboundspx)
  - [setMaxBoundsViscosity()](#setmaxboundsviscosity)
  - [setUpscaleFilter()](#setupscalefilter)
  - [setWrapX()](#setwrapx)
- [View](#view)
  - [getCenter()](#getcenter)
  - [getPointerAbs()](#getpointerabs)
  - [getZoom()](#getzoom)
  - [invalidateSize()](#invalidatesize)
  - [resetIconScale()](#reseticonscale)
  - [setAutoResize()](#setautoresize)
  - [setFpsCap()](#setfpscap)
  - [transition()](#transition)

Defined in: [api/map.ts:49](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L49)

## Type Parameters

### TMarkerData

`TMarkerData` = `unknown`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [api/map.ts:378](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L378)

Destroy the map instance and release all resources.

#### Returns

`void`

***

### setCoordBounds()

> **setCoordBounds**(`bounds`): `this`

Defined in: [api/map.ts:227](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L227)

Initialize or update the source coordinate bounds used for translating external coordinates
(e.g., Unreal/world coords) into map pixel coordinates.

#### Parameters

##### bounds

[`SourceBounds`](TypeAlias.SourceBounds.md)

Source coordinate rectangle: `{ minX, minY, maxX, maxY }`

#### Returns

`this`

This map instance for chaining

#### Remarks

The mapping fits the source rectangle into the image pixel space while preserving aspect ratio
(uniform scale) and centering letter/pillarboxing as needed.

***

### setIconScaleFunction()

> **setIconScaleFunction**(`fn`): `this`

Defined in: [api/map.ts:315](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L315)

Set a custom function to control icon scaling vs. zoom.

#### Parameters

##### fn

Returns a scale multiplier, where `1` means screen‑fixed size. Pass `null` to reset to default (`1`).

`null` | [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

#### Returns

`this`

This map instance for chaining

#### Remarks

The function receives `(zoom, minZoom, maxZoom)` and is evaluated per frame. The resulting multiplier
scales the icon's intrinsic width/height and anchor in screen space. For smoother visuals, use a
continuous curve and clamp extremes.

#### Example

```ts
// Make icons grow/shrink with zoom around Z=3
map.setIconScaleFunction((z) => Math.pow(2, z - 3));

// Keep icons screen‑fixed regardless of zoom (default)
map.setIconScaleFunction(() => 1);

// Step-based behavior: small at low zooms, larger at high zooms
map.setIconScaleFunction((z) => z < 2 ? 0.75 : z < 4 ? 1 : 1.25);

// Reset to default policy
map.setIconScaleFunction(null);
```

***

### setWheelSpeed()

> **setWheelSpeed**(`v`): `this`

Defined in: [api/map.ts:545](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L545)

Set mouse‑wheel zoom speed.

#### Parameters

##### v

`number`

Speed multiplier (0.01–2.0)

#### Returns

`this`

This map instance for chaining

#### Example

```ts
// Wire to a range input for user control
const input = document.querySelector('#wheelSpeed') as HTMLInputElement;
input.oninput = () => map.setWheelSpeed(Number(input.value));
```

***

### translate()

> **translate**(`x`, `y`, `type`): `object`

Defined in: [api/map.ts:251](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L251)

Translate a point from the configured source coordinate space to map pixel coordinates.

#### Parameters

##### x

`number`

Source X

##### y

`number`

Source Y

##### type

[`TransformType`](TypeAlias.TransformType.md) = `'original'`

Optional transform to apply ('original' by default)

#### Returns

`object`

Pixel coordinates `{ x, y }` in the image space

##### x

> **x**: `number`

##### y

> **y**: `number`

#### Example

```ts
map.setCoordBounds({ minX: -500_000, minY: -500_000, maxX: 500_000, maxY: 500_000 });
const p = map.translate(wx, wy, 'flipVertical');
map.addMarker(p.x, p.y);
```

## Content

### markers

> `readonly` **markers**: [`Layer`](Class.Layer.md)\<[`Marker`](Class.Marker.md)\<`TMarkerData`\>\>

Defined in: [api/map.ts:59](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L59)

Marker layer for this map. Use to add/remove markers and subscribe to layer events.

#### Example

```ts
const m = map.addMarker(100, 200);
map.markers.events.on('entityadd').each(({ entity }) => console.log('added', entity.id));
```

***

### vectors

> `readonly` **vectors**: [`Layer`](Class.Layer.md)\<[`Vector`](Class.Vector.md)\>

Defined in: [api/map.ts:64](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L64)

Vector layer for this map. Use to add/remove vectors and subscribe to layer events.

***

### addIcon()

> **addIcon**(`def`, `id?`): [`IconHandle`](Interface.IconHandle.md)

Defined in: [api/map.ts:412](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L412)

Register an icon definition for use with markers.

#### Parameters

##### def

[`IconDef`](Interface.IconDef.md)

Icon bitmap metadata and source paths

##### id?

`string`

Optional stable id (auto-generated when omitted)

#### Returns

[`IconHandle`](Interface.IconHandle.md)

Handle used by [GTMap.addMarker](#addmarker)

#### Example

```ts
// Register a 24x24 pin with a 2x asset and bottom-center anchor
const pin = map.addIcon({
  iconPath: '/icons/pin-24.png',
  x2IconPath: '/icons/pin-48.png',
  width: 24,
  height: 24,
  anchorX: 12,
  anchorY: 24,
});
// Use the icon when adding a marker
const m = map.addMarker(2048, 2048, { icon: pin, size: 1.0 });
```

***

### addMarker()

> **addMarker**(`x`, `y`, `opts?`): [`Marker`](Class.Marker.md)\<`TMarkerData`\>

Defined in: [api/map.ts:448](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L448)

Create and add a marker to the `markers` layer.

#### Parameters

##### x

`number`

World X (pixels)

##### y

`number`

World Y (pixels)

##### opts?

Optional style and user data

###### data?

`TMarkerData`

Arbitrary app data stored on the marker

###### icon?

[`IconHandle`](Interface.IconHandle.md)

Handle from [GTMap.addIcon](#addicon) (defaults to built-in dot)

###### rotation?

`number`

Rotation in degrees clockwise

###### size?

`number`

Scale multiplier (default 1)

#### Returns

[`Marker`](Class.Marker.md)\<`TMarkerData`\>

The created [Marker](Class.Marker.md)

#### Example

```ts
// Add a POI marker using a registered icon
const poi = map.addMarker(1200, 900, { icon: pin, size: 1.25, rotation: 0, data: { id: 'poi-7' } });
poi.events.on('click', (e) => console.log('clicked', e.marker.id));
```

***

### addVector()

> **addVector**(`geometry`): [`Vector`](Class.Vector.md)

Defined in: [api/map.ts:470](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L470)

Create and add a [Vector](Class.Vector.md) to the `vectors` layer.

#### Parameters

##### geometry

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

Vector geometry (polyline, polygon, circle)

#### Returns

[`Vector`](Class.Vector.md)

The created [Vector](Class.Vector.md)

#### Example

```ts
// Add a polyline
const v = map.addVector({ type: 'polyline', points: [ { x: 0, y: 0 }, { x: 100, y: 50 } ] });
// Later, update its geometry
v.setGeometry({ type: 'circle', center: { x: 200, y: 200 }, radius: 40 });
```

***

### clearMarkers()

> **clearMarkers**(): `this`

Defined in: [api/map.ts:483](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L483)

Remove all markers from the map.

#### Returns

`this`

This map instance for method chaining

***

### clearVectors()

> **clearVectors**(): `this`

Defined in: [api/map.ts:494](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L494)

Remove all vector shapes from the map.

#### Returns

`this`

This map instance for method chaining

## Events

### events

#### Get Signature

> **get** **events**(): [`MapEvents`](Interface.MapEvents.md)\<`TMarkerData`\>

Defined in: [api/map.ts:723](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L723)

Read-only map events surface (`on`/`once`).

##### Example

```ts
map.events.on('move').each(({ view }) => console.log(view.center, view.zoom));
await map.events.once('zoomend');
```

##### Returns

[`MapEvents`](Interface.MapEvents.md)\<`TMarkerData`\>

## Lifecycle

### Constructor

> **new GTMap**\<`TMarkerData`\>(`container`, `options`): `GTMap`\<`TMarkerData`\>

Defined in: [api/map.ts:87](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L87)

Creates a new GTMap instance.

#### Parameters

##### container

`HTMLElement`

The HTML element to render the map into

##### options

[`MapOptions`](Interface.MapOptions.md)

Configuration options for the map

#### Returns

`GTMap`\<`TMarkerData`\>

***

### resume()

> **resume**(): `this`

Defined in: [api/map.ts:369](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L369)

Resume a suspended map, restoring rendering.

#### Returns

`this`

This map instance for chaining

#### Example

```ts
map.resume();
```

***

### suspend()

> **suspend**(`opts?`): `this`

Defined in: [api/map.ts:353](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L353)

Suspend the map, pausing rendering and optionally releasing GPU resources.

#### Parameters

##### opts?

[`SuspendOptions`](Interface.SuspendOptions.md)

Optional behavior

#### Returns

`this`

This map instance for chaining

#### Example

```ts
// Pause rendering and release VRAM
map.suspend({ releaseGL: true });
// Later, resume
map.resume();
```

## Tiles & Styling

### setBackgroundColor()

> **setBackgroundColor**(`color`): `this`

Defined in: [api/map.ts:628](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L628)

Set the viewport background.

#### Parameters

##### color

Color string or RGB object; `'transparent'` for fully transparent

`string` | \{ `a?`: `number`; `b`: `number`; `g`: `number`; `r`: `number`; \}

#### Returns

`this`

This map instance for chaining

#### Remarks

Policy: either `'transparent'` (fully transparent) or a solid color; alpha on colors is ignored.

#### Example

```ts
// Transparent viewport (useful over custom app backgrounds)
map.setBackgroundColor('transparent');
// Switch to a solid dark background
map.setBackgroundColor('#0a0a0a');
```

***

### setGridVisible()

> **setGridVisible**(`on`): `this`

Defined in: [api/map.ts:271](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L271)

Show or hide the pixel grid overlay.

#### Parameters

##### on

`boolean`

`true` to show, `false` to hide

#### Returns

`this`

This map instance for chaining

***

### setMaxBoundsPx()

> **setMaxBoundsPx**(`bounds`): `this`

Defined in: [api/map.ts:575](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L575)

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

Defined in: [api/map.ts:588](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L588)

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

Defined in: [api/map.ts:283](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L283)

Set the upscale filtering mode for the base image when zoomed in.

#### Parameters

##### mode

`'auto'` | `'linear'` | `'bicubic'`

`"auto"` | `"linear"` | `"bicubic"`

#### Returns

`this`

This map instance for chaining

***

### setWrapX()

> **setWrapX**(`on`): `this`

Defined in: [api/map.ts:560](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L560)

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

Defined in: [api/map.ts:507](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L507)

Get the current center position in world pixels.

#### Returns

[`Point`](TypeAlias.Point.md)

The center position

***

### getPointerAbs()

> **getPointerAbs**(): `null` \| \{ `x`: `number`; `y`: `number`; \}

Defined in: [api/map.ts:528](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L528)

Get the last pointer position in world pixels.

#### Returns

`null` \| \{ `x`: `number`; `y`: `number`; \}

Position or `null` if outside the map

***

### getZoom()

> **getZoom**(): `number`

Defined in: [api/map.ts:518](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L518)

Get the current zoom level.

#### Returns

`number`

The zoom value (fractional allowed)

***

### invalidateSize()

> **invalidateSize**(): `this`

Defined in: [api/map.ts:707](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L707)

Recompute canvas sizes after external container changes.

#### Returns

`this`

This map instance for chaining

***

### resetIconScale()

> **resetIconScale**(): `this`

Defined in: [api/map.ts:331](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L331)

Reset icon scaling to default (screen-fixed, scale = 1).

#### Returns

`this`

This map instance for chaining

#### Example

```ts
map.resetIconScale();
```

***

### setAutoResize()

> **setAutoResize**(`on`): `this`

Defined in: [api/map.ts:649](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L649)

Enable or disable automatic resize handling.

#### Parameters

##### on

`boolean`

`true` to enable, `false` to disable

#### Returns

`this`

This map instance for chaining

#### Remarks

When enabled, a ResizeObserver watches the container (debounced via rAF) and a window
resize listener tracks DPR changes.

#### Example

```ts
// Manage size manually: disable auto and call invalidate on layout changes
map.setAutoResize(false);
map.invalidateSize();
```

***

### setFpsCap()

> **setFpsCap**(`v`): `this`

Defined in: [api/map.ts:606](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L606)

Set the maximum frames per second.

#### Parameters

##### v

`number`

FPS limit (15-240)

#### Returns

`this`

This map instance for chaining

#### Example

```ts
// Lower FPS cap to save battery
map.setFpsCap(30);
```

***

### transition()

> **transition**(): [`ViewTransition`](Interface.ViewTransition.md)

Defined in: [api/map.ts:743](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/map.ts#L743)

Start a chainable view transition.

#### Returns

[`ViewTransition`](Interface.ViewTransition.md)

#### Remarks

The builder is side-effect free until [apply()](Interface.ViewTransition.md#apply) is called.
