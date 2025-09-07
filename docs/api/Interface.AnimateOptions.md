[**@gaming.tools/gtmap**](README.md)

***

# Interface: AnimateOptions

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [delayMs?](#delayms)
  - [durationMs](#durationms)
  - [easing?](#easing)
  - [interrupt?](#interrupt)

Defined in: [api/types.ts:444](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L444)

Options for animating a transition.

## Properties

### delayMs?

> `optional` **delayMs**: `number`

Defined in: [api/types.ts:450](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L450)

Optional delay before starting, in milliseconds.

***

### durationMs

> **durationMs**: `number`

Defined in: [api/types.ts:446](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L446)

Total animation time in milliseconds.

***

### easing?

> `optional` **easing**: [`Easing`](TypeAlias.Easing.md)

Defined in: [api/types.ts:448](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L448)

Optional easing function; defaults to a built‑in ease curve.

***

### interrupt?

> `optional` **interrupt**: `"cancel"` \| `"join"` \| `"enqueue"`

Defined in: [api/types.ts:458](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L458)

Policy when another transition targets the same object.

- `cancel` (default): stop the previous transition
- `join`: retarget the current transition to the new end state
- `enqueue`: start after the current one finishes
