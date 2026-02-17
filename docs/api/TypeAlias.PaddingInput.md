[**@gaming.tools/gtmap**](README.md)

***

# Type Alias: PaddingInput

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Example](#example)

> **PaddingInput** = `number` \| \{ `bottom`: `number`; `left`: `number`; `right`: `number`; `top`: `number`; \}

Defined in: [api/types.ts:522](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L522)

Padding specification for view fitting operations.

## Remarks

When a `number` is provided it is applied uniformly to all four sides.
Pass an object with `top`, `right`, `bottom`, `left` for per-side control.
Negative values are clamped to zero.

## Example

```ts
// Uniform 50 px padding on every side
const pad: PaddingInput = 50;

// Asymmetric padding (e.g. to avoid a sidebar)
const pad: PaddingInput = { top: 20, right: 300, bottom: 20, left: 20 };
```
