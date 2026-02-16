[**@gaming.tools/gtmap**](README.md)

***

# Type Alias: IconScaleFunction()

[← Back to API index](./README.md)

## Contents

- [Parameters](#parameters)
  - [zoom](#zoom)
  - [minZoom](#minzoom)
  - [maxZoom](#maxzoom)
- [Returns](#returns)
- [Remarks](#remarks)

> **IconScaleFunction** = (`zoom`, `minZoom`, `maxZoom`) => `number`

Defined in: [api/types.ts:498](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L498)

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
