[**@gaming.tools/gtmap**](README.md)

***

# Interface: ViewTransition

Defined in: [internal/core/view-transition.ts:19](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/internal/core/view-transition.ts#L19)

## Methods

### apply()

> **apply**(`opts?`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [internal/core/view-transition.ts:71](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/internal/core/view-transition.ts#L71)

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

Defined in: [internal/core/view-transition.ts:52](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/internal/core/view-transition.ts#L52)

Fit the view to the specified bounds with optional padding.

#### Parameters

##### b

Bounding box in world pixels

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

***

### cancel()

> **cancel**(): `void`

Defined in: [internal/core/view-transition.ts:78](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/internal/core/view-transition.ts#L78)

Cancel a pending or running transition.

If already settled, this is a no‑op.

#### Returns

`void`

***

### center()

> **center**(`p`): `this`

Defined in: [internal/core/view-transition.ts:26](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/internal/core/view-transition.ts#L26)

Set the target center position in world pixels.

#### Parameters

##### p

[`Point`](TypeAlias.Point.md)

Target center point

#### Returns

`this`

The builder for chaining

***

### offset()

> **offset**(`dx`, `dy`): `this`

Defined in: [internal/core/view-transition.ts:43](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/internal/core/view-transition.ts#L43)

Add an offset to the final center position.

#### Parameters

##### dx

`number`

Horizontal offset in world pixels

##### dy

`number`

Vertical offset in world pixels

#### Returns

`this`

The builder for chaining

***

### points()

> **points**(`list`, `padding?`): `this`

Defined in: [internal/core/view-transition.ts:61](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/internal/core/view-transition.ts#L61)

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

Defined in: [internal/core/view-transition.ts:34](https://github.com/gamingtools/gt-map/blob/a4029f6df3cc8a6f91da4a56273e036d6e335d81/packages/gtmap/src/internal/core/view-transition.ts#L34)

Set the target zoom level.

#### Parameters

##### z

`number`

Target zoom (fractional allowed)

#### Returns

`this`

The builder for chaining
