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

Defined in: [api/types.ts:447](https://github.com/gamingtools/gt-map/blob/83eed0a31c8285593128578c674ef7d7858d10a3/packages/gtmap/src/api/types.ts#L447)

Options for animating a transition.

## Properties

### delayMs?

> `optional` **delayMs**: `number`

Defined in: [api/types.ts:453](https://github.com/gamingtools/gt-map/blob/83eed0a31c8285593128578c674ef7d7858d10a3/packages/gtmap/src/api/types.ts#L453)

Optional delay before starting, in milliseconds.

***

### durationMs

> **durationMs**: `number`

Defined in: [api/types.ts:449](https://github.com/gamingtools/gt-map/blob/83eed0a31c8285593128578c674ef7d7858d10a3/packages/gtmap/src/api/types.ts#L449)

Total animation time in milliseconds.

***

### easing?

> `optional` **easing**: [`Easing`](TypeAlias.Easing.md)

Defined in: [api/types.ts:451](https://github.com/gamingtools/gt-map/blob/83eed0a31c8285593128578c674ef7d7858d10a3/packages/gtmap/src/api/types.ts#L451)

Optional easing function; defaults to a built‑in ease curve.

***

### interrupt?

> `optional` **interrupt**: `"cancel"` \| `"join"` \| `"enqueue"`

Defined in: [api/types.ts:461](https://github.com/gamingtools/gt-map/blob/83eed0a31c8285593128578c674ef7d7858d10a3/packages/gtmap/src/api/types.ts#L461)

Policy when another transition targets the same object.

- `cancel` (default): stop the previous transition
- `join`: retarget the current transition to the new end state
- `enqueue`: start after the current one finishes
