[**@gaming.tools/gtmap**](README.md)

***

# Type Alias: PaddingInput

> **PaddingInput** = `number` \| \{ `bottom`: `number`; `left`: `number`; `right`: `number`; `top`: `number`; \}

Defined in: [api/types.ts:531](https://github.com/gamingtools/gt-map/blob/60b7d85a08927f385c0b7e39626596679a619336/packages/gtmap/src/api/types.ts#L531)

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
