[**@gaming.tools/gtmap**](README.md)

***

# Interface: ApplyResult

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [error?](#error)
  - [status](#status)

Defined in: [api/types.ts:491](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L491)

Result returned by [apply](Interface.ApplyOptions.md) Promises.

## Properties

### error?

> `optional` **error**: `unknown`

Defined in: [api/types.ts:495](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L495)

Error details if status is 'error'

***

### status

> **status**: [`ApplyStatus`](TypeAlias.ApplyStatus.md)

Defined in: [api/types.ts:493](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L493)

Completion status of the transition.
