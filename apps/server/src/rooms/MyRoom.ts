import { Client, Room } from '@colyseus/core'
import {
  closestTown,
  Dim,
  MyRoomState,
  Player,
  Town,
  VecSchema,
  toJson,
  sub,
  normalize,
  add,
  mult,
} from '../shared'
import { townNames } from './townNames'
import { v4 as randomUuid } from 'uuid'

const randomColor = () =>
  `#${Math.floor(Math.random() * 16777215).toString(16)}`

const mapWidth = 30
const mapHeight = 30

const randomSpawnPos = () =>
  new VecSchema({
    x: (Math.random() - 0.5) * mapWidth,
    y: (Math.random() - 0.5) * mapHeight,
  })

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4

  onCreate(options: any) {
    console.log('MyRoom created!', options)
    const state = new MyRoomState()
    Array(10)
      .fill(0)
      .map(
        () =>
          new Town({
            id: randomUuid(),
            name: townNames[Math.floor(Math.random() * townNames.length)],
            pos: randomSpawnPos(),
            maxPopulation: 10_000,
            population: 10_000,
            dailyRations: 365 * 10_000,
          }),
      )
      .forEach((town) => {
        state.towns.set(town.id, town)
      })

    state.size = new Dim(mapWidth, mapHeight)
    console.log('state', state.toJSON())
    this.setState(state)

    this.onMessage('click', (client, data) => {
      // get reference to the player who sent the message
      const player = this.state.players.get(client.sessionId)

      player.target = new VecSchema(data)
    })

    this.setSimulationInterval((deltaTime) => {
      this.update(deltaTime)
    })
  }

  update(deltaTime: number) {
    const dt = deltaTime / 1000
    const velocity = 1
    this.state.players.forEach((player) => {
      const dir = normalize(sub(player.target, player.pos))
      player.pos = new VecSchema(add(player.pos, mult(dir, velocity * dt)))

      const dHunger = 0.01

      player.hunger = Math.max(0, player.hunger - dHunger * dt)

      const dSoldier = player.hunger
      player.soldiers = Math.max(0, player.soldiers - dSoldier * dt)

      const towns = Object.values(toJson(this.state.towns))
      this.state.towns.get(closestTown(player.pos, towns).id).dailyRations -=
        player.soldiers * dt
    })
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, 'joined!')
    // create Player instance¬

    const player = new Player()

    // place Player at a random position
    player.pos = randomSpawnPos()
    player.color = randomColor()
    // place player in the map of players by its sessionId
    // (client.sessionId is unique per connection!)
    this.state.players.set(client.sessionId, player)
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, 'left!')

    this.state.players.delete(client.sessionId)
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...')
  }
}
