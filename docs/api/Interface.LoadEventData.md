[**@gaming.tools/gtmap**](README.md)

***

# Interface: LoadEventData

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [size](#size)
  - [view](#view)

Defined in: [api/types.ts:243](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L243)

Load event payload: fired once after the first frame is scheduled.

## Properties

### size

> **size**: `object`

Defined in: [api/types.ts:247](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L247)

Final container size and device pixel ratio.

#### dpr

> **dpr**: `number`

#### height

> **height**: `number`

#### width

> **width**: `number`

***

### view

> **view**: [`ViewState`](Interface.ViewState.md)

Defined in: [api/types.ts:245](https://github.com/gamingtools/gt-map/blob/35acd9478b1c1a453a247be3fa176a9fab8133e5/packages/gtmap/src/api/types.ts#L245)

Current view state snapshot.
