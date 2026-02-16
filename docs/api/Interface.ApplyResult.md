[**@gaming.tools/gtmap**](README.md)

***

# Interface: ApplyResult

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [error?](#error)
  - [status](#status)

Defined in: [api/types.ts:669](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L669)

Result returned by [apply](Interface.ApplyOptions.md) Promises.

## Properties

### error?

> `optional` **error**: `unknown`

Defined in: [api/types.ts:673](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L673)

Error details if status is 'error'

***

### status

> **status**: [`ApplyStatus`](TypeAlias.ApplyStatus.md)

Defined in: [api/types.ts:671](https://github.com/gamingtools/gt-map/blob/519c67acbd59e79f858abbb775fd1ea25ef71ebb/packages/gtmap/src/api/types.ts#L671)

Completion status of the transition.
