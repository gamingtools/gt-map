[**@gaming.tools/gtmap**](README.md)

***

# Class: ViewFacade

[← Back to API index](./README.md)

## Contents

- [Methods](#methods)
  - [cancelView()](#cancelview)
  - [getCenter()](#getcenter)
  - [getPointerAbs()](#getpointerabs)
  - [getZoom()](#getzoom)
  - [invalidateSize()](#invalidatesize)
  - [resetIconScale()](#reseticonscale)
  - [setAutoResize()](#setautoresize)
  - [setClipToBounds()](#setcliptobounds)
  - [setCoordBounds()](#setcoordbounds)
  - [setIconScaleFunction()](#seticonscalefunction)
  - [setMaxBoundsPx()](#setmaxboundspx)
  - [setMaxBoundsViscosity()](#setmaxboundsviscosity)
  - [setView()](#setview)
  - [setWrapX()](#setwrapx)
  - [translate()](#translate)

Defined in: [api/facades/view-facade.ts:34](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L34)

## Methods

### cancelView()

> **cancelView**(): `void`

Defined in: [api/facades/view-facade.ts:212](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L212)

Cancel an active [setView](#setview) transition without starting a new one.

If no transition is in-flight this is a no-op.
The cancelled `setView` promise resolves with `{ status: 'canceled' }`.

#### Returns

`void`

#### Example

```ts
const p = map.view.setView({ center: FAR_AWAY, animate: { durationMs: 2000 } });
// ...user presses Escape
map.view.cancelView();
const result = await p; // { status: 'canceled' }
```

***

### getCenter()

> **getCenter**(): [`Point`](TypeAlias.Point.md)

Defined in: [api/facades/view-facade.ts:47](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L47)

Get the current center position in world pixels.

#### Returns

[`Point`](TypeAlias.Point.md)

***

### getPointerAbs()

> **getPointerAbs**(): `null` \| \{ `x`: `number`; `y`: `number`; \}

Defined in: [api/facades/view-facade.ts:62](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L62)

Get the last pointer position in world pixels.

#### Returns

`null` \| \{ `x`: `number`; `y`: `number`; \}

***

### getZoom()

> **getZoom**(): `number`

Defined in: [api/facades/view-facade.ts:55](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L55)

Get the current zoom level.

#### Returns

`number`

***

### invalidateSize()

> **invalidateSize**(): `void`

Defined in: [api/facades/view-facade.ts:269](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L269)

Recompute canvas sizes after external container changes.

#### Returns

`void`

***

### resetIconScale()

> **resetIconScale**(): `void`

Defined in: [api/facades/view-facade.ts:255](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L255)

Reset icon scaling to default.

#### Returns

`void`

***

### setAutoResize()

> **setAutoResize**(`on`): `void`

Defined in: [api/facades/view-facade.ts:262](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L262)

Enable or disable automatic resize handling.

#### Parameters

##### on

`boolean`

#### Returns

`void`

***

### setClipToBounds()

> **setClipToBounds**(`on`): `void`

Defined in: [api/facades/view-facade.ts:241](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L241)

Enable or disable clipping to map image bounds.

#### Parameters

##### on

`boolean`

#### Returns

`void`

***

### setCoordBounds()

> **setCoordBounds**(`bounds`): `void`

Defined in: [api/facades/view-facade.ts:276](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L276)

Set source coordinate bounds for external-to-pixel mapping.

#### Parameters

##### bounds

[`SourceBounds`](TypeAlias.SourceBounds.md)

#### Returns

`void`

***

### setIconScaleFunction()

> **setIconScaleFunction**(`fn`): `void`

Defined in: [api/facades/view-facade.ts:248](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L248)

Set a custom icon scale function.

#### Parameters

##### fn

`null` | [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

#### Returns

`void`

***

### setMaxBoundsPx()

> **setMaxBoundsPx**(`bounds`): `void`

Defined in: [api/facades/view-facade.ts:227](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L227)

Constrain panning to pixel bounds. Pass null to clear.

#### Parameters

##### bounds

`null` | [`MaxBoundsPx`](Interface.MaxBoundsPx.md)

#### Returns

`void`

***

### setMaxBoundsViscosity()

> **setMaxBoundsViscosity**(`v`): `void`

Defined in: [api/facades/view-facade.ts:234](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L234)

Set bounds viscosity (0..1).

#### Parameters

##### v

`number`

#### Returns

`void`

***

### setView()

> **setView**(`opts`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [api/facades/view-facade.ts:106](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L106)

Set the map view (center, zoom, bounds) instantly or with animation.

Calling `setView` while a previous call is still in-flight automatically
cancels the earlier one (its promise resolves with `{ status: 'canceled' }`).
Use [cancelView](#cancelview) to cancel without starting a new transition.

#### Parameters

##### opts

[`SetViewOptions`](Interface.SetViewOptions.md)

Describes the target view state and optional animation.

#### Returns

`Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

A promise that resolves with an [ApplyResult](Interface.ApplyResult.md):

| `status`      | Meaning |
|---------------|---------|
| `'instant'`   | View was applied without animation. |
| `'animated'`  | Animation completed normally. |
| `'canceled'`  | Transition was superseded or explicitly cancelled. |
| `'complete'`  | No-op -- the view was already at the target. |
| `'error'`     | An unexpected error occurred (see `result.error`). |

#### Example

```ts
// Instant jump
await map.view.setView({ center: { x: 4096, y: 4096 }, zoom: 3 });

// Animated fly-to with easing
await map.view.setView({
  center: HOME,
  zoom: 5,
  animate: { durationMs: 800, easing: easings.easeInOutCubic },
});

// Fit to bounds with padding
await map.view.setView({
  bounds: { minX: 100, minY: 100, maxX: 7000, maxY: 7000 },
  padding: 40,
  animate: { durationMs: 600 },
});
```

#### See

[SetViewOptions](Interface.SetViewOptions.md) for full option reference.

***

### setWrapX()

> **setWrapX**(`on`): `void`

Defined in: [api/facades/view-facade.ts:220](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L220)

Enable or disable horizontal world wrap.

#### Parameters

##### on

`boolean`

#### Returns

`void`

***

### translate()

> **translate**(`x`, `y`, `type`): `object`

Defined in: [api/facades/view-facade.ts:285](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/facades/view-facade.ts#L285)

Translate from source coordinates to map pixel coordinates.

#### Parameters

##### x

`number`

##### y

`number`

##### type

[`TransformType`](TypeAlias.TransformType.md) = `'original'`

#### Returns

`object`

##### x

> **x**: `number`

##### y

> **y**: `number`
