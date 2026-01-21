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

Defined in: [api/types.ts:460](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L460)

Options for animating a transition.

## Properties

### delayMs?

> `optional` **delayMs**: `number`

Defined in: [api/types.ts:466](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L466)

Optional delay before starting, in milliseconds.

***

### durationMs

> **durationMs**: `number`

Defined in: [api/types.ts:462](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L462)

Total animation time in milliseconds.

***

### easing?

> `optional` **easing**: [`Easing`](TypeAlias.Easing.md)

Defined in: [api/types.ts:464](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L464)

Optional easing function; defaults to a built‑in ease curve.

***

### interrupt?

> `optional` **interrupt**: `"cancel"` \| `"join"` \| `"enqueue"`

Defined in: [api/types.ts:474](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L474)

Policy when another transition targets the same object.

- `cancel` (default): stop the previous transition
- `join`: retarget the current transition to the new end state
- `enqueue`: start after the current one finishes
