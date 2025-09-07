[**@gaming.tools/gtmap**](README.md)

***

# Class: GTMap

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Example](#example)
- [Constructors](#constructors)
  - [Constructor](#constructor)
- [Properties](#properties)
  - [markers](#markers)
  - [vectors](#vectors)
- [Accessors](#accessors)
  - [events](#events)
  - [pointerAbs](#pointerabs)
- [Methods](#methods)
  - [addIcon()](#addicon)
  - [addMarker()](#addmarker)
  - [addVector()](#addvector)
  - [addVectors()](#addvectors)
  - [clearMarkers()](#clearmarkers)
  - [clearVectors()](#clearvectors)
  - [destroy()](#destroy)
  - [getCenter()](#getcenter)
  - [getZoom()](#getzoom)
  - [invalidateSize()](#invalidatesize)
  - [setActive()](#setactive)
  - [setAutoResize()](#setautoresize)
  - [setBackgroundColor()](#setbackgroundcolor)
  - [setFpsCap()](#setfpscap)
  - [setGridVisible()](#setgridvisible)
  - [setIconScaleFunction()](#seticonscalefunction)
  - [setTileSource()](#settilesource)
  - [setUpscaleFilter()](#setupscalefilter)
  - [setWheelSpeed()](#setwheelspeed)
  - [transition()](#transition)

Defined in: [api/Map.ts:50](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L50)

GTMap - A high‑performance WebGL map renderer with a pixel‑based coordinate system.

## Remarks

Use this facade to configure tiles, control the view, add content and subscribe to events.

## Example

```ts
// Create a map with an initial tile source and view
const map = new GTMap(document.getElementById('map')!, {
  tileUrl: 'https://example.com/tiles/{z}/{x}_{y}.webp',
  center: { x: 4096, y: 4096 },
  zoom: 3,
  maxZoom: 5
});
```

## Constructors

### Constructor

> **new GTMap**(`container`, `options`): `GTMap`

Defined in: [api/Map.ts:88](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L88)

Creates a new GTMap instance.

#### Parameters

##### container

`HTMLElement`

The HTML element to render the map into

##### options

[`MapOptions`](Interface.MapOptions.md) = `{}`

Configuration options for the map

#### Returns

`GTMap`

## Properties

### markers

> `readonly` **markers**: [`Layer`](Class.Layer.md)\<[`Marker`](Class.Marker.md)\>

Defined in: [api/Map.ts:59](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L59)

Marker layer for this map. Use to add/remove markers and subscribe to layer events.

#### Example

```ts
const m = map.addMarker(100, 200);
map.markers.events.on('entityadd').each(({ entity }) => console.log('added', entity.id));
```

***

### vectors

> `readonly` **vectors**: [`Layer`](Class.Layer.md)\<[`VectorEntity`](Class.VectorEntity.md)\>

Defined in: [api/Map.ts:63](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L63)

Vector layer for this map. Use to add/remove vectors and subscribe to layer events.

## Accessors

### events

#### Get Signature

> **get** **events**(): [`MapEvents`](Interface.MapEvents.md)

Defined in: [api/Map.ts:598](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L598)

Read‑only map events surface (`on`/`once`).

##### Example

```ts
map.events.on('move').each(({ view }) => console.log(view.center, view.zoom));
await map.events.once('zoomend');
```

##### Returns

[`MapEvents`](Interface.MapEvents.md)

***

### pointerAbs

#### Get Signature

> **get** **pointerAbs**(): `null` \| \{ `x`: `number`; `y`: `number`; \}

Defined in: [api/Map.ts:469](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L469)

Get the last pointer position in world pixels.

##### Returns

`null` \| \{ `x`: `number`; `y`: `number`; \}

Position or `null` if outside the map

## Methods

### addIcon()

> **addIcon**(`def`, `id?`): [`IconHandle`](Interface.IconHandle.md)

Defined in: [api/Map.ts:335](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L335)

Register an icon definition for use with markers.

#### Parameters

##### def

[`IconDef`](Interface.IconDef.md)

Icon bitmap metadata and source paths

##### id?

`string`

Optional stable id (auto‑generated when omitted)

#### Returns

[`IconHandle`](Interface.IconHandle.md)

Handle used by [GTMap.addMarker](#addmarker)

#### Example

```ts
// Register a 24x24 pin with a 2x asset and bottom‑center anchor
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

> **addMarker**(`x`, `y`, `opts?`): [`Marker`](Class.Marker.md)

Defined in: [api/Map.ts:370](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L370)

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

`unknown`

Arbitrary app data stored on the marker

###### icon?

[`IconHandle`](Interface.IconHandle.md)

Handle from [GTMap.addIcon](#addicon) (defaults to built‑in dot)

###### rotation?

`number`

Rotation in degrees clockwise

###### size?

`number`

Scale multiplier (default 1)

#### Returns

[`Marker`](Class.Marker.md)

The created [Marker](Class.Marker.md)

#### Example

```ts
// Add a POI marker using a registered icon
const poi = map.addMarker(1200, 900, { icon: pin, size: 1.25, rotation: 0, data: { id: 'poi-7' } });
poi.events.on('click', (e) => console.log('clicked', e.marker.id));
```

***

### addVector()

> **addVector**(`geometry`): [`VectorEntity`](Class.VectorEntity.md)

Defined in: [api/Map.ts:415](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L415)

Create and add a [Vector](Class.VectorEntity.md) to the `vectors` layer.

#### Parameters

##### geometry

[`VectorGeometry`](TypeAlias.VectorGeometry.md)

Vector geometry (polyline, polygon, circle)

#### Returns

[`VectorEntity`](Class.VectorEntity.md)

The created [Vector](Class.VectorEntity.md)
 *
 *

#### Example

* ```ts
 * // Add a polyline
 * const v = map.addVector({ type: 'polyline', points: [ { x: 0, y: 0 }, { x: 100, y: 50 } ] });
 * // Later, update its geometry
 * v.setGeometry({ type: 'circle', center: { x: 200, y: 200 }, radius: 40 });
 * ```

***

### addVectors()

> **addVectors**(`_vectors`): `this`

Defined in: [api/Map.ts:387](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L387)

Add legacy vector primitives in a single batch (temporary helper).
Prefer `addVector(geometry)` for the entity-based API.

#### Parameters

##### \_vectors

[`Vector`](TypeAlias.Vector.md)[]

#### Returns

`this`

***

### clearMarkers()

> **clearMarkers**(): `this`

Defined in: [api/Map.ts:427](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L427)

Remove all markers from the map.

#### Returns

`this`

***

### clearVectors()

> **clearVectors**(): `this`

Defined in: [api/Map.ts:437](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L437)

Remove all vectors from the map.

#### Returns

`this`

***

### destroy()

> **destroy**(): `void`

Defined in: [api/Map.ts:301](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L301)

Destroy the map instance and release all resources.

#### Returns

`void`

***

### getCenter()

> **getCenter**(): [`Point`](TypeAlias.Point.md)

Defined in: [api/Map.ts:450](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L450)

Get the current center position in world pixels.

#### Returns

[`Point`](TypeAlias.Point.md)

The center position

***

### getZoom()

> **getZoom**(): `number`

Defined in: [api/Map.ts:460](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L460)

Get the current zoom level.

#### Returns

`number`

The zoom value (fractional allowed)

***

### invalidateSize()

> **invalidateSize**(): `this`

Defined in: [api/Map.ts:582](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L582)

Recompute canvas sizes after external container changes.

#### Returns

`this`

This map instance for chaining

***

### setActive()

> **setActive**(`on`, `opts?`): `this`

Defined in: [api/Map.ts:292](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L292)

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

### setAutoResize()

> **setAutoResize**(`on`): `this`

Defined in: [api/Map.ts:541](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L541)

Enable or disable automatic resize handling.

#### Parameters

##### on

`boolean`

#### Returns

`this`

#### Remarks

When enabled, a ResizeObserver watches the container (debounced via rAF) and a window
resize listener tracks DPR changes.
Example:
```ts
// Manage size manually: disable auto and call invalidate on layout changes
map.setAutoResize(false);
map.invalidateSize();
```

***

### setBackgroundColor()

> **setBackgroundColor**(`color`): `this`

Defined in: [api/Map.ts:523](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L523)

Set the viewport background.

#### Parameters

##### color

`string` | \{ `a?`: `number`; `b`: `number`; `g`: `number`; `r`: `number`; \}

#### Returns

`this`

#### Remarks

Policy: either `'transparent'` (fully transparent) or a solid color; alpha on colors is ignored.
Example:
```ts
// Transparent viewport (useful over custom app backgrounds)
map.setBackgroundColor('transparent');
// Switch to a solid dark background
map.setBackgroundColor('#0a0a0a');
```

***

### setFpsCap()

> **setFpsCap**(`v`): `this`

Defined in: [api/Map.ts:504](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L504)

Set the maximum frames per second.

#### Parameters

##### v

`number`

FPS limit (15–240)

#### Returns

`this`

This map instance for chaining

#### Remarks

Example:
```ts
// Lower FPS cap to save battery
map.setFpsCap(30);
```

***

### setGridVisible()

> **setGridVisible**(`on`): `this`

Defined in: [api/Map.ts:243](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L243)

Show or hide the tile grid overlay.

#### Parameters

##### on

`boolean`

`true` to show, `false` to hide

#### Returns

`this`

This map instance for chaining

***

### setIconScaleFunction()

> **setIconScaleFunction**(`fn`): `this`

Defined in: [api/Map.ts:272](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L272)

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

### setTileSource()

> **setTileSource**(`opts`): `this`

Defined in: [api/Map.ts:228](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L228)

Configure or replace the tile source.

#### Parameters

##### opts

[`TileSourceOptions`](Interface.TileSourceOptions.md)

Tile source configuration

#### Returns

`this`

This map instance for chaining

#### Example

* ```ts
 * // Replace the tile source with a finite 8k image pyramid (no wrap)
 * map.setTileSource({
 *   url: 'https://tiles.example.com/{z}/{x}_{y}.webp',
 *   tileSize: 256,
 *   sourceMaxZoom: 5,
 *   mapSize: { width: 8192, height: 8192 },
 *   wrapX: false,
 *   clearCache: true
 * });
 * ```

***

### setUpscaleFilter()

> **setUpscaleFilter**(`mode`): `this`

Defined in: [api/Map.ts:254](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L254)

Set the upscale filtering mode for low‑resolution tiles.

#### Parameters

##### mode

`'auto'` | `'linear'` | `'bicubic'`

`"auto"` | `"linear"` | `"bicubic"`

#### Returns

`this`

This map instance for chaining

***

### setWheelSpeed()

> **setWheelSpeed**(`v`): `this`

Defined in: [api/Map.ts:486](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L486)

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

***

### transition()

> **transition**(): [`ViewTransition`](Interface.ViewTransition.md)

Defined in: [api/Map.ts:617](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L617)

Start a chainable view transition.

#### Returns

[`ViewTransition`](Interface.ViewTransition.md)

#### Remarks

The builder is side‑effect free until [apply()](Interface.ViewTransition.md#apply) is called.
