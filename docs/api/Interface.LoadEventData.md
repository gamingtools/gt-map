[**@gaming.tools/gtmap**](README.md)

***

# Interface: LoadEventData

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [size](#size)
  - [view](#view)

Defined in: [api/types.ts:252](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L252)

Load event payload: fired once after the first frame is scheduled.

## Properties

### size

> **size**: `object`

Defined in: [api/types.ts:256](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L256)

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

Defined in: [api/types.ts:254](https://github.com/gamingtools/gt-map/blob/1ee81ca74138d650b25917e14b4f82162e73963e/packages/gtmap/src/api/types.ts#L254)

Current view state snapshot.
