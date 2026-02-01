[**@gaming.tools/gtmap**](README.md)

***

# Interface: ApplyResult

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [error?](#error)
  - [status](#status)

Defined in: [api/types.ts:626](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L626)

Result returned by [apply](Interface.ApplyOptions.md) Promises.

## Properties

### error?

> `optional` **error**: `unknown`

Defined in: [api/types.ts:630](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L630)

Error details if status is 'error'

***

### status

> **status**: [`ApplyStatus`](TypeAlias.ApplyStatus.md)

Defined in: [api/types.ts:628](https://github.com/gamingtools/gt-map/blob/5a2bc977f1d6f1065e37e4f5d2c2817935068be0/packages/gtmap/src/api/types.ts#L628)

Completion status of the transition.
