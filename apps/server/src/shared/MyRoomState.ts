import { MapSchema, Schema, type } from '@colyseus/schema'
import { ToJSON } from './colyseus-utils'

export type Vec = { x: number; y: number }

export const origin: Vec = {
  x: 0,
  y: 0,
}
export const add = (a: Vec, b: Vec) => ({
  x: a.x + b.x,
  y: a.y + b.y,
})
export const sub = (a: Vec, b: Vec) => ({
  x: a.x - b.x,
  y: a.y - b.y,
})
export const mult = (a: Vec, k: number) => ({
  x: a.x * k,
  y: a.y * k,
})
export const length = (a: Vec) => Math.sqrt(a.x * a.x + a.y * a.y)
export const normalize = (a: Vec) => mult(a, 1 / length(a))
export const dist = (a: Vec, b: Vec) => length(sub(a, b))

export class VecSchema extends Schema {
  @type('number') x: number
  @type('number') y: number

  constructor(obj?: ToJSON<VecSchema>) {
    super()
    Object.assign(this, obj ?? origin)
  }

  copy(v: VecSchema) {
    this.x = v.x
    this.y = v.y
  }
}

export class Town extends Schema {
  @type('string') id: string
  @type(VecSchema) pos: VecSchema = new VecSchema()
  @type('string') name: string = ''
  @type('number') maxPopulation: number = 10_000
  @type('number') population: number = 10_000
  @type('number') dailyRations: number = 365 * 10_000

  constructor(obj: ToJSON<Town>) {
    super()
    Object.assign(this, obj)
  }
}

export const closestTown = (
  pos: Vec,
  towns: ToJSON<Town>[],
): ToJSON<Town> | undefined => {
  const firstTown = towns[0]
  if (!firstTown) {
    return undefined
  }
  return towns.reduce(
    (acc, town) => {
      const d = dist(pos, town.pos)
      if (d < acc.dist) {
        return { town, dist: d }
      }
      return acc
    },
    {
      town: firstTown,
      dist: dist(pos, firstTown.pos),
    },
  ).town
}
export class Player extends Schema {
  @type(VecSchema) pos: VecSchema = new VecSchema()
  @type(VecSchema) target: VecSchema = new VecSchema()
  @type('string') color: string = '#FFFFFF'
  @type('number') soldiers: number = 10_000
  @type('number') hunger: number = 1
}

export class Dim extends Schema {
  @type('number') width: number = 0
  @type('number') height: number = 0

  constructor(width: number = 0, height: number = 0) {
    super()
    this.width = width
    this.height = height
  }
}

export class MyRoomState extends Schema {
  @type(Dim) size: Dim
  @type({ map: Player }) players = new MapSchema<Player>()
  @type({ map: Town }) towns = new MapSchema<Town>()
}
