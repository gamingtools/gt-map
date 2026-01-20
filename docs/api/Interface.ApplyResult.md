[**@gaming.tools/gtmap**](README.md)

***

# Interface: ApplyResult

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [error?](#error)
  - [status](#status)

Defined in: [api/types.ts:478](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L478)

Result returned by [apply](Interface.ApplyOptions.md) Promises.

## Properties

### error?

> `optional` **error**: `unknown`

Defined in: [api/types.ts:482](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L482)

Error details if status is 'error'

***

### status

> **status**: [`ApplyStatus`](TypeAlias.ApplyStatus.md)

Defined in: [api/types.ts:480](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L480)

Completion status of the transition.
