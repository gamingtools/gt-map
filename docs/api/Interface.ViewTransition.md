[**@gaming.tools/gtmap**](README.md)

***

# Interface: ViewTransition

Defined in: [api/Map.ts:690](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L690)

## Methods

### apply()

> **apply**(`opts?`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [api/Map.ts:696](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L696)

#### Parameters

##### opts?

[`ApplyOptions`](Interface.ApplyOptions.md)

#### Returns

`Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

***

### bounds()

> **bounds**(`b`, `padding?`): `this`

Defined in: [api/Map.ts:694](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L694)

#### Parameters

##### b

###### maxX

`number`

###### maxY

`number`

###### minX

`number`

###### minY

`number`

##### padding?

`number` | \{ `bottom`: `number`; `left`: `number`; `right`: `number`; `top`: `number`; \}

#### Returns

`this`

***

### cancel()

> **cancel**(): `void`

Defined in: [api/Map.ts:697](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L697)

#### Returns

`void`

***

### center()

> **center**(`p`): `this`

Defined in: [api/Map.ts:691](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L691)

#### Parameters

##### p

[`Point`](TypeAlias.Point.md)

#### Returns

`this`

***

### offset()

> **offset**(`dx`, `dy`): `this`

Defined in: [api/Map.ts:693](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L693)

#### Parameters

##### dx

`number`

##### dy

`number`

#### Returns

`this`

***

### points()

> **points**(`list`, `padding?`): `this`

Defined in: [api/Map.ts:695](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L695)

#### Parameters

##### list

[`Point`](TypeAlias.Point.md)[]

##### padding?

`number` | \{ `bottom`: `number`; `left`: `number`; `right`: `number`; `top`: `number`; \}

#### Returns

`this`

***

### zoom()

> **zoom**(`z`): `this`

Defined in: [api/Map.ts:692](https://github.com/gamingtools/gt-map/blob/37582d0663306e25f7b67e6e3ae4390bd14c21af/packages/gtmap/src/api/Map.ts#L692)

#### Parameters

##### z

`number`

#### Returns

`this`
