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

Defined in: [api/types.ts:414](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L414)

Options for animating a transition.

## Properties

### delayMs?

> `optional` **delayMs**: `number`

Defined in: [api/types.ts:420](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L420)

Optional delay before starting, in milliseconds.

***

### durationMs

> **durationMs**: `number`

Defined in: [api/types.ts:416](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L416)

Total animation time in milliseconds.

***

### easing?

> `optional` **easing**: [`Easing`](TypeAlias.Easing.md)

Defined in: [api/types.ts:418](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L418)

Optional easing function; defaults to a built‑in ease curve.

***

### interrupt?

> `optional` **interrupt**: `"cancel"` \| `"join"` \| `"enqueue"`

Defined in: [api/types.ts:428](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L428)

Policy when another transition targets the same object.

- `cancel` (default): stop the previous transition
- `join`: retarget the current transition to the new end state
- `enqueue`: start after the current one finishes
