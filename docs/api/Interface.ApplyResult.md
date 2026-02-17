[**@gaming.tools/gtmap**](README.md)

***

# Interface: ApplyResult

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [error?](#error)
  - [status](#status)

Defined in: [api/types.ts:671](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L671)

Result returned by [apply](Interface.ApplyOptions.md) Promises.

## Properties

### error?

> `optional` **error**: `unknown`

Defined in: [api/types.ts:675](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L675)

Error details if status is 'error'

***

### status

> **status**: [`ApplyStatus`](TypeAlias.ApplyStatus.md)

Defined in: [api/types.ts:673](https://github.com/gamingtools/gt-map/blob/6e5b4ff27bf09f0e785ef4a3d4f9d13135759b96/packages/gtmap/src/api/types.ts#L673)

Completion status of the transition.
