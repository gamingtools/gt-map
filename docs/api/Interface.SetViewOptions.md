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

Defined in: [api/types.ts:521](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L521)

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

Defined in: [api/types.ts:577](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L577)

Animation parameters. When omitted the view change is applied instantly.

#### See

[AnimateOptions](Interface.AnimateOptions.md)

***

### bounds?

> `optional` **bounds**: `object`

Defined in: [api/types.ts:552](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L552)

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

Defined in: [api/types.ts:528](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L528)

Target center position in world pixels.

When combined with `bounds` or `points`, this value takes precedence
for the center while the fitted zoom is kept.

***

### offset?

> `optional` **offset**: `object`

Defined in: [api/types.ts:544](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L544)

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

Defined in: [api/types.ts:570](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L570)

Padding applied when fitting `bounds` or `points`.

Has no effect when neither `bounds` nor `points` is specified.
Accepts a uniform number or a per-side object.

#### See

[PaddingInput](TypeAlias.PaddingInput.md)

***

### points?

> `optional` **points**: [`Point`](TypeAlias.Point.md)[]

Defined in: [api/types.ts:560](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L560)

Array of world-pixel points to fit the viewport around.

Internally converted to a bounding box and then fitted.
Ignored when `bounds` is also provided.

***

### zoom?

> `optional` **zoom**: `number`

Defined in: [api/types.ts:536](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L536)

Target zoom level (fractional values allowed).

When combined with `bounds` or `points`, this value takes precedence
for the zoom while the fitted center is kept.
