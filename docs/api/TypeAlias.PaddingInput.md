[**@gaming.tools/gtmap**](README.md)

***

# Type Alias: PaddingInput

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Example](#example)

> **PaddingInput** = `number` \| \{ `bottom`: `number`; `left`: `number`; `right`: `number`; `top`: `number`; \}

Defined in: [api/types.ts:477](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L477)

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
