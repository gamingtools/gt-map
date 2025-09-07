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
  - [zoom()](#zoom)

Defined in: [api/Map.ts:698](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/Map.ts#L698)

Chainable view transition builder.

Configure desired changes (center/zoom/bounds/points/offset), then commit with [apply()](#apply).
The builder is side‑effect free until `apply()` is called.

## Methods

### apply()

> **apply**(`opts?`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [api/Map.ts:767](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/Map.ts#L767)

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

Defined in: [api/Map.ts:748](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/Map.ts#L748)

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

Defined in: [api/Map.ts:774](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/Map.ts#L774)

Cancel a pending or running transition.

If already settled, this is a no‑op.

#### Returns

`void`

***

### center()

> **center**(`p`): `this`

Defined in: [api/Map.ts:709](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/Map.ts#L709)

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

Defined in: [api/Map.ts:732](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/Map.ts#L732)

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

Defined in: [api/Map.ts:757](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/Map.ts#L757)

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

### zoom()

> **zoom**(`z`): `this`

Defined in: [api/Map.ts:722](https://github.com/gamingtools/gt-map/blob/158dafcef9898e0f3f71a5a95a93f4449df181ba/packages/gtmap/src/api/Map.ts#L722)

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
