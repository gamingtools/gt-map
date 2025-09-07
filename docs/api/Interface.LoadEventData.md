[**@gaming.tools/gtmap**](README.md)

***

# Interface: LoadEventData

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [size](#size)
  - [view](#view)

Defined in: [api/types.ts:229](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L229)

Load event payload: fired once after the first frame is scheduled.

## Properties

### size

> **size**: `object`

Defined in: [api/types.ts:233](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L233)

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

Defined in: [api/types.ts:231](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L231)

Current view state snapshot.
