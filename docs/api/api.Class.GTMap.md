[**@gaming.tools/gtmap**](README.md)

***

# Class: GTMap

Defined in: [api/Map.ts:49](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L49)

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

Defined in: [api/Map.ts:87](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L87)

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

Defined in: [api/Map.ts:58](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L58)

Marker layer for this map. Use to add/remove markers and subscribe to layer events.

#### Example

```ts
const m = map.addMarker(100, 200);
map.markers.events.on('entityadd').each(({ entity }) => console.log('added', entity.id));
```

***

### vectors

> `readonly` **vectors**: [`Layer`](Class.Layer.md)\<[`Vector`](Class.Vector.md)\>

Defined in: [api/Map.ts:62](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L62)

Vector layer for this map. Use to add/remove vectors and subscribe to layer events.

## Accessors

### events

#### Get Signature

> **get** **events**(): [`MapEvents`](Interface.MapEvents.md)

Defined in: [api/Map.ts:593](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L593)

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

Defined in: [api/Map.ts:467](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L467)

Get the last pointer position in world pixels.

##### Returns

`null` \| \{ `x`: `number`; `y`: `number`; \}

Position or `null` if outside the map

## Methods

### \_animateView()

> **\_animateView**(`opts`): `void`

Defined in: [api/Map.ts:543](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L543)

#### Parameters

##### opts

###### center?

[`Point`](TypeAlias.Point.md)

###### durationMs

`number`

###### easing?

(`t`) => `number`

###### zoom?

`number`

#### Returns

`void`

***

### \_applyInstant()

> **\_applyInstant**(`center?`, `zoom?`): `void`

Defined in: [api/Map.ts:200](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L200)

#### Parameters

##### center?

[`Point`](TypeAlias.Point.md)

##### zoom?

`number`

#### Returns

`void`

***

### \_cancelPanZoom()

> **\_cancelPanZoom**(): `void`

Defined in: [api/Map.ts:550](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L550)

#### Returns

`void`

***

### \_fitBounds()

> **\_fitBounds**(`b`, `padding`): `object`

Defined in: [api/Map.ts:555](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L555)

#### Parameters

##### b

###### maxX

`number`

###### maxY

`number`

###### minX

`number`

###### minY

`number`

##### padding

###### bottom

`number`

###### left

`number`

###### right

`number`

###### top

`number`

#### Returns

`object`

##### center

> **center**: [`Point`](TypeAlias.Point.md)

##### zoom

> **zoom**: `number`

***

### addIcon()

> **addIcon**(`def`, `id?`): [`IconHandle`](Interface.IconHandle.md)

Defined in: [api/Map.ts:333](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L333)

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

Defined in: [api/Map.ts:368](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L368)

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

> **addVector**(`geometry`): [`Vector`](Class.Vector.md)

Defined in: [api/Map.ts:413](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L413)

Create and add a [Vector](Class.Vector.md) to the `vectors` layer.

#### Parameters

##### geometry

`VectorGeometry`

Vector geometry (polyline, polygon, circle)

#### Returns

[`Vector`](Class.Vector.md)

The created [Vector](Class.Vector.md)
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

Defined in: [api/Map.ts:385](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L385)

Add legacy vector primitives in a single batch (temporary helper).
Prefer `addVector(geometry)` for the entity-based API.

#### Parameters

##### \_vectors

[`VectorLegacy`](api.TypeAlias.VectorLegacy.md)[]

#### Returns

`this`

***

### clearMarkers()

> **clearMarkers**(): `this`

Defined in: [api/Map.ts:425](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L425)

Remove all markers from the map.

#### Returns

`this`

***

### clearVectors()

> **clearVectors**(): `this`

Defined in: [api/Map.ts:435](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L435)

Remove all vectors from the map.

#### Returns

`this`

***

### destroy()

> **destroy**(): `void`

Defined in: [api/Map.ts:299](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L299)

Destroy the map instance and release all resources.

#### Returns

`void`

***

### getCenter()

> **getCenter**(): [`Point`](TypeAlias.Point.md)

Defined in: [api/Map.ts:448](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L448)

Get the current center position in world pixels.

#### Returns

[`Point`](TypeAlias.Point.md)

The center position

***

### getZoom()

> **getZoom**(): `number`

Defined in: [api/Map.ts:458](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L458)

Get the current zoom level.

#### Returns

`number`

The zoom value (fractional allowed)

***

### invalidateSize()

> **invalidateSize**(): `this`

Defined in: [api/Map.ts:577](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L577)

Recompute canvas sizes after external container changes.

#### Returns

`this`

This map instance for chaining

***

### setActive()

> **setActive**(`on`, `opts?`): `this`

Defined in: [api/Map.ts:290](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L290)

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

Defined in: [api/Map.ts:539](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L539)

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

Defined in: [api/Map.ts:521](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L521)

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

Defined in: [api/Map.ts:502](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L502)

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

Defined in: [api/Map.ts:241](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L241)

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

Defined in: [api/Map.ts:270](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L270)

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

Defined in: [api/Map.ts:226](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L226)

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

Defined in: [api/Map.ts:252](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L252)

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

Defined in: [api/Map.ts:484](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L484)

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

> **transition**(): [`ViewTransition`](api.Interface.ViewTransition.md)

Defined in: [api/Map.ts:612](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L612)

Start a chainable view transition.

#### Returns

[`ViewTransition`](api.Interface.ViewTransition.md)

#### Remarks

The builder is side‑effect free until [apply()](api.Interface.ViewTransition.md#apply) is called.
