[**@gaming.tools/gtmap**](README.md)

***

# Interface: SetViewOptions

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Example](#example)
- [Properties](#properties)
  - [animate?](#animate)
  - [bounds?](#bounds)
  - [center?](#center)
  - [offset?](#offset)
  - [padding?](#padding)
  - [points?](#points)
  - [zoom?](#zoom)

Defined in: [api/types.ts:566](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L566)

Options for [ViewFacade.setView](Class.ViewFacade.md#setview).

## Remarks

All fields are optional. Omitting every field is a no-op that resolves with
`{ status: 'complete' }`.

**Resolution order:**
1. `bounds` or `points` are converted to a center + zoom via fit logic.
2. An explicit `center` overrides the center derived from bounds/points.
3. An explicit `zoom` overrides the zoom derived from bounds/points.
4. `offset` is added to whichever center was resolved (or the current center).
5. `padding` is applied only when `bounds` or `points` are used.

When `animate` is provided the view animates; otherwise the change is instant.

## Example

```ts
// Instant jump to a position
await map.view.setView({ center: { x: 4096, y: 4096 }, zoom: 3 });

// Animated fly-to
await map.view.setView({ center: HOME, animate: { durationMs: 800 } });

// Fit bounds with padding
await map.view.setView({
  bounds: { minX: 100, minY: 100, maxX: 7000, maxY: 7000 },
  padding: 40,
  animate: { durationMs: 600 },
});

// Fit a set of points
await map.view.setView({
  points: [{ x: 500, y: 500 }, { x: 6000, y: 6000 }],
  padding: { top: 20, right: 20, bottom: 20, left: 200 },
});

// Offset the current view
await map.view.setView({ offset: { dx: 100, dy: -50 } });
```

## Properties

### animate?

> `optional` **animate**: [`AnimateOptions`](Interface.AnimateOptions.md)

Defined in: [api/types.ts:622](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L622)

Animation parameters. When omitted the view change is applied instantly.

#### See

[AnimateOptions](Interface.AnimateOptions.md)

***

### bounds?

> `optional` **bounds**: `object`

Defined in: [api/types.ts:597](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L597)

Bounding box in world pixels to fit the viewport to.

The view is centered and zoomed so the entire box is visible.
Mutually exclusive intent with `points` (if both are set, `bounds` wins).

#### maxX

> **maxX**: `number`

#### maxY

> **maxY**: `number`

#### minX

> **minX**: `number`

#### minY

> **minY**: `number`

***

### center?

> `optional` **center**: [`Point`](TypeAlias.Point.md)

Defined in: [api/types.ts:573](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L573)

Target center position in world pixels.

When combined with `bounds` or `points`, this value takes precedence
for the center while the fitted zoom is kept.

***

### offset?

> `optional` **offset**: `object`

Defined in: [api/types.ts:589](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L589)

Pixel offset added to the resolved center.

Applied after `center`, `bounds`, or `points` resolution, making it
useful for nudging the view relative to its computed position.

#### dx

> **dx**: `number`

#### dy

> **dy**: `number`

***

### padding?

> `optional` **padding**: [`PaddingInput`](TypeAlias.PaddingInput.md)

Defined in: [api/types.ts:615](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L615)

Padding applied when fitting `bounds` or `points`.

Has no effect when neither `bounds` nor `points` is specified.
Accepts a uniform number or a per-side object.

#### See

[PaddingInput](TypeAlias.PaddingInput.md)

***

### points?

> `optional` **points**: [`Point`](TypeAlias.Point.md)[]

Defined in: [api/types.ts:605](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L605)

Array of world-pixel points to fit the viewport around.

Internally converted to a bounding box and then fitted.
Ignored when `bounds` is also provided.

***

### zoom?

> `optional` **zoom**: `number`

Defined in: [api/types.ts:581](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L581)

Target zoom level (fractional values allowed).

When combined with `bounds` or `points`, this value takes precedence
for the zoom while the fitted center is kept.
