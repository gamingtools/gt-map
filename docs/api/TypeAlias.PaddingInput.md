[**@gaming.tools/gtmap**](README.md)

***

# Type Alias: PaddingInput

[← Back to API index](./README.md)

## Contents

- [Remarks](#remarks)
- [Example](#example)

> **PaddingInput** = `number` \| \{ `bottom`: `number`; `left`: `number`; `right`: `number`; `top`: `number`; \}

Defined in: [api/types.ts:520](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L520)

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
