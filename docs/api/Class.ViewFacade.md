[**@gaming.tools/gtmap**](README.md)

***

# Class: ViewFacade

Defined in: [api/facades/view-facade.ts:34](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L34)

## Methods

### cancelView()

> **cancelView**(): `void`

Defined in: [api/facades/view-facade.ts:214](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L214)

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

Defined in: [api/facades/view-facade.ts:47](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L47)

Get the current center position in world pixels.

#### Returns

[`Point`](TypeAlias.Point.md)

***

### getPointerAbs()

> **getPointerAbs**(): `null` \| \{ `x`: `number`; `y`: `number`; \}

Defined in: [api/facades/view-facade.ts:62](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L62)

Get the last pointer position in world pixels.

#### Returns

`null` \| \{ `x`: `number`; `y`: `number`; \}

***

### getZoom()

> **getZoom**(): `number`

Defined in: [api/facades/view-facade.ts:55](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L55)

Get the current zoom level.

#### Returns

`number`

***

### invalidateSize()

> **invalidateSize**(): `void`

Defined in: [api/facades/view-facade.ts:271](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L271)

Recompute canvas sizes after external container changes.

#### Returns

`void`

***

### resetIconScale()

> **resetIconScale**(): `void`

Defined in: [api/facades/view-facade.ts:257](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L257)

Reset icon scaling to default.

#### Returns

`void`

***

### setAutoResize()

> **setAutoResize**(`on`): `void`

Defined in: [api/facades/view-facade.ts:264](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L264)

Enable or disable automatic resize handling.

#### Parameters

##### on

`boolean`

#### Returns

`void`

***

### setClipToBounds()

> **setClipToBounds**(`on`): `void`

Defined in: [api/facades/view-facade.ts:243](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L243)

Enable or disable clipping to map image bounds.

#### Parameters

##### on

`boolean`

#### Returns

`void`

***

### setCoordBounds()

> **setCoordBounds**(`bounds`): `void`

Defined in: [api/facades/view-facade.ts:278](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L278)

Set source coordinate bounds for external-to-pixel mapping.

#### Parameters

##### bounds

[`SourceBounds`](TypeAlias.SourceBounds.md)

#### Returns

`void`

***

### setIconScaleFunction()

> **setIconScaleFunction**(`fn`): `void`

Defined in: [api/facades/view-facade.ts:250](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L250)

Set a custom icon scale function.

#### Parameters

##### fn

`null` | [`IconScaleFunction`](TypeAlias.IconScaleFunction.md)

#### Returns

`void`

***

### setMaxBoundsPx()

> **setMaxBoundsPx**(`bounds`): `void`

Defined in: [api/facades/view-facade.ts:229](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L229)

Constrain panning to pixel bounds. Pass null to clear.

#### Parameters

##### bounds

`null` | [`MaxBoundsPx`](Interface.MaxBoundsPx.md)

#### Returns

`void`

***

### setMaxBoundsViscosity()

> **setMaxBoundsViscosity**(`v`): `void`

Defined in: [api/facades/view-facade.ts:236](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L236)

Set bounds viscosity (0..1).

#### Parameters

##### v

`number`

#### Returns

`void`

***

### setView()

> **setView**(`opts`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [api/facades/view-facade.ts:106](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L106)

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

Defined in: [api/facades/view-facade.ts:222](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L222)

Enable or disable horizontal world wrap.

#### Parameters

##### on

`boolean`

#### Returns

`void`

***

### translate()

> **translate**(`x`, `y`, `type`): `object`

Defined in: [api/facades/view-facade.ts:287](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/facades/view-facade.ts#L287)

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
