[**@gaming.tools/gtmap**](README.md)

***

# Interface: ResizeEventData

[← Back to API index](./README.md)

## Contents

- [Properties](#properties)
  - [size](#size)
  - [view](#view)

Defined in: [api/types.ts:226](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L226)

Resize event payload: fired after a debounced resize completes.

## Properties

### size

> **size**: `object`

Defined in: [api/types.ts:230](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L230)

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

Defined in: [api/types.ts:228](https://github.com/gamingtools/gt-map/blob/02ad961dd733041f2c6c39034ee7c302a553f45a/packages/gtmap/src/api/types.ts#L228)

Current view state snapshot.
