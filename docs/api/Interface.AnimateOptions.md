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

Defined in: [api/types.ts:638](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L638)

Options for animating a transition.

## Properties

### delayMs?

> `optional` **delayMs**: `number`

Defined in: [api/types.ts:644](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L644)

Optional delay before starting, in milliseconds.

***

### durationMs

> **durationMs**: `number`

Defined in: [api/types.ts:640](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L640)

Total animation time in milliseconds.

***

### easing?

> `optional` **easing**: [`Easing`](TypeAlias.Easing.md)

Defined in: [api/types.ts:642](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L642)

Optional easing function; defaults to a built‑in ease curve.

***

### interrupt?

> `optional` **interrupt**: `"cancel"` \| `"join"` \| `"enqueue"`

Defined in: [api/types.ts:652](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L652)

Policy when another transition targets the same object.

- `cancel` (default): stop the previous transition
- `join`: retarget the current transition to the new end state
- `enqueue`: start after the current one finishes
