[**@gaming.tools/gtmap**](README.md)

***

# Interface: AnimateOptions

Defined in: [api/types.ts:439](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/types.ts#L439)

Options for animating a transition.

## Properties

### delayMs?

> `optional` **delayMs**: `number`

Defined in: [api/types.ts:445](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/types.ts#L445)

Optional delay before starting, in milliseconds.

***

### durationMs

> **durationMs**: `number`

Defined in: [api/types.ts:441](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/types.ts#L441)

Total animation time in milliseconds.

***

### easing?

> `optional` **easing**: [`Easing`](TypeAlias.Easing.md)

Defined in: [api/types.ts:443](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/types.ts#L443)

Optional easing function; defaults to a built‑in ease curve.

***

### interrupt?

> `optional` **interrupt**: `"cancel"` \| `"join"` \| `"enqueue"`

Defined in: [api/types.ts:453](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/types.ts#L453)

Policy when another transition targets the same object.

- `cancel` (default): stop the previous transition
- `join`: retarget the current transition to the new end state
- `enqueue`: start after the current one finishes
