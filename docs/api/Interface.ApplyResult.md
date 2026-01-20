[**@gaming.tools/gtmap**](README.md)

***

# Interface: ApplyResult

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [error?](#error)
  - [status](#status)

Defined in: [api/types.ts:475](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L475)

Result returned by [apply](Interface.ApplyOptions.md) Promises.

## Properties

### error?

> `optional` **error**: `unknown`

Defined in: [api/types.ts:479](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L479)

Error details if status is 'error'

***

### status

> **status**: [`ApplyStatus`](TypeAlias.ApplyStatus.md)

Defined in: [api/types.ts:477](https://github.com/gamingtools/gt-map/blob/6b6b511db05d2521ce5caa9af1679c9c1ef796c1/packages/gtmap/src/api/types.ts#L477)

Completion status of the transition.
