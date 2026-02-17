[**@gaming.tools/gtmap**](README.md)

***

# Type Alias: IconScaleFunction()

> **IconScaleFunction** = (`zoom`, `minZoom`, `maxZoom`) => `number`

Defined in: [api/types.ts:509](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L509)

Icon scaling policy.

## Parameters

### zoom

`number`

Current map zoom (fractional allowed)

### minZoom

`number`

Effective minimum zoom for the current image/view

### maxZoom

`number`

Effective maximum zoom for the current image/view

## Returns

`number`

A scale multiplier where `1.0` means screen‑fixed size.

## Remarks

The return value multiplies each icon's intrinsic width/height and its anchor.
Use `() => 1` to keep icons screen‑fixed; use a zoom‑based curve (e.g., `Math.pow(2, zoom - 3)`) to
make icons appear to scale with the world.

The function is evaluated per frame for the current zoom. For stability, prefer continuous curves
or clamp the output to a sensible range.
