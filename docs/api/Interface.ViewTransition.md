[**@gaming.tools/gtmap**](README.md)

***

# Interface: ViewTransition

[← Back to API index](./README.md)

## Contents

- [Methods](#methods)
  - [apply()](#apply)
  - [bounds()](#bounds)
  - [cancel()](#cancel)
  - [center()](#center)
  - [offset()](#offset)
  - [points()](#points)
  - [rotate()](#rotate)
  - [zoom()](#zoom)

Defined in: [api/Map.ts:850](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L850)

Chainable view transition builder.

Configure desired changes (center/zoom/bounds/points/offset), then commit with [apply()](#apply).
The builder is side‑effect free until `apply()` is called.

## Methods

### apply()

> **apply**(`opts?`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [api/Map.ts:928](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L928)

Commit the transition.

When `opts.animate` is omitted, the change is applied instantly. With animation,
the returned promise resolves when relevant end events are observed.

#### Parameters

##### opts?

[`ApplyOptions`](Interface.ApplyOptions.md)

Apply/animation options

#### Returns

`Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

A promise resolving with the [result](Interface.ApplyResult.md)

***

### bounds()

> **bounds**(`b`, `padding?`): `this`

Defined in: [api/Map.ts:900](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L900)

Fit the view to a bounding box with optional padding.

Padding may be a single number (applied on all sides) or a per‑side object.

#### Parameters

##### b

Bounds in world pixels

###### maxX

`number`

###### maxY

`number`

###### minX

`number`

###### minY

`number`

##### padding?

Uniform number or `{ top, right, bottom, left }`

`number` | \{ `bottom`: `number`; `left`: `number`; `right`: `number`; `top`: `number`; \}

#### Returns

`this`

The builder for chaining

#### Example

```ts
await map.transition()
  .bounds({ minX: 1000, minY: 1000, maxX: 2000, maxY: 1800 }, 24)
  .apply({ animate: { durationMs: 500 } });
```

***

### cancel()

> **cancel**(): `void`

Defined in: [api/Map.ts:935](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L935)

Cancel a pending or running transition.

If already settled, this is a no‑op.

#### Returns

`void`

***

### center()

> **center**(`p`): `this`

Defined in: [api/Map.ts:861](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L861)

Target an absolute center position in world pixels.

#### Parameters

##### p

[`Point`](TypeAlias.Point.md)

Target center `{ x, y }` in world pixels

#### Returns

`this`

The builder for chaining

#### Example

```ts
await map.transition().center({ x: 4096, y: 4096 }).apply();
```

***

### offset()

> **offset**(`dx`, `dy`): `this`

Defined in: [api/Map.ts:884](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L884)

Offset the current or targeted center by a delta in world pixels.

Can be combined with [center()](#center).

#### Parameters

##### dx

`number`

X delta in pixels

##### dy

`number`

Y delta in pixels

#### Returns

`this`

The builder for chaining

***

### points()

> **points**(`list`, `padding?`): `this`

Defined in: [api/Map.ts:909](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L909)

Fit the view to a set of points with optional padding.

#### Parameters

##### list

[`Point`](TypeAlias.Point.md)[]

Points in world pixels

##### padding?

Uniform number or `{ top, right, bottom, left }`

`number` | \{ `bottom`: `number`; `left`: `number`; `right`: `number`; `top`: `number`; \}

#### Returns

`this`

The builder for chaining

***

### rotate()

> **rotate**(`deg`, `opts?`): `this`

Defined in: [api/Map.ts:918](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L918)

Rotate the map to an absolute bearing in degrees (clockwise).

#### Parameters

##### deg

`number`

Target rotation in degrees (CW positive)

##### opts?

Optional entity rotation behavior

###### markerRotationMode?

[`MarkerRotationMode`](TypeAlias.MarkerRotationMode.md)

#### Returns

`this`

The builder for chaining

***

### zoom()

> **zoom**(`z`): `this`

Defined in: [api/Map.ts:874](https://github.com/gamingtools/gt-map/blob/670061005a2701ff4986e8986471b4dd55d13ca7/packages/gtmap/src/api/Map.ts#L874)

Target an absolute zoom level.

Zoom is a continuous number; integers align with image pyramid levels.

#### Parameters

##### z

`number`

Target zoom

#### Returns

`this`

The builder for chaining

#### Example

```ts
await map.transition().zoom(4).apply({ animate: { durationMs: 400 } });
```
