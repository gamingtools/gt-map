[**@gaming.tools/gtmap**](README.md)

***

# Interface: ResizeEventData

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [size](#size)
  - [view](#view)

Defined in: [api/types.ts:237](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L237)

Resize event payload: fired after a debounced resize completes.

## Properties

### size

> **size**: `object`

Defined in: [api/types.ts:241](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L241)

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

Defined in: [api/types.ts:239](https://github.com/gamingtools/gt-map/blob/05d69e937e6093e14da4884825215d18bb9b0084/packages/gtmap/src/api/types.ts#L239)

Current view state snapshot.
