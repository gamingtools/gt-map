[**@gaming.tools/gtmap**](README.md)

***

# Interface: ViewTransition

Defined in: [api/Map.ts:685](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L685)

## Methods

### apply()

> **apply**(`opts?`): `Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

Defined in: [api/Map.ts:691](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L691)

#### Parameters

##### opts?

[`ApplyOptions`](Interface.ApplyOptions.md)

#### Returns

`Promise`\<[`ApplyResult`](Interface.ApplyResult.md)\>

***

### bounds()

> **bounds**(`b`, `padding?`): `this`

Defined in: [api/Map.ts:689](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L689)

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

Defined in: [api/Map.ts:692](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L692)

#### Returns

`void`

***

### center()

> **center**(`p`): `this`

Defined in: [api/Map.ts:686](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L686)

#### Parameters

##### p

[`Point`](TypeAlias.Point.md)

#### Returns

`this`

***

### offset()

> **offset**(`dx`, `dy`): `this`

Defined in: [api/Map.ts:688](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L688)

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

Defined in: [api/Map.ts:690](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L690)

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

Defined in: [api/Map.ts:687](https://github.com/gamingtools/gt-map/blob/c25f4e7cc6e0afbbb4b9d41c7742cebe14ba6cd1/packages/gtmap/src/api/Map.ts#L687)

#### Parameters

##### z

`number`

#### Returns

`this`
