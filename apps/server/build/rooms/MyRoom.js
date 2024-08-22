"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyRoom = void 0;
const core_1 = require("@colyseus/core");
const MyRoomState_1 = require("./schema/MyRoomState");
// } from './schema/MyRoomState2'
// } from 'aoc-common'
const townNames_1 = require("./townNames");
const uuid_1 = require("uuid");
const randomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;
const mapWidth = 30;
const mapHeight = 30;
const randomSpawnPos = () => new MyRoomState_1.Vec(Math.random() * mapWidth - mapWidth / 2, Math.random() * mapHeight - mapHeight / 2);
class MyRoom extends core_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 4;
    }
    onCreate(options) {
        console.log('MyRoom created!', options);
        const state = new MyRoomState_1.MyRoomState();
        Array(10)
            .fill(0)
            .map(() => new MyRoomState_1.Town({
            id: (0, uuid_1.v4)(),
            name: townNames_1.townNames[Math.floor(Math.random() * townNames_1.townNames.length)],
            pos: randomSpawnPos(),
            maxPopulation: 10_000,
            population: 10_000,
            dailyRations: 365 * 10_000,
        }))
            .forEach((town) => {
            state.towns.set(town.id, town);
        });
        state.size = new MyRoomState_1.Dim(mapWidth, mapHeight);
        console.log('state', state.toJSON());
        this.setState(state);
        this.onMessage('click', (client, data) => {
            // get reference to the player who sent the message
            const player = this.state.players.get(client.sessionId);
            player.target = new MyRoomState_1.Vec(data.x, data.z);
        });
        this.setSimulationInterval((deltaTime) => {
            this.update(deltaTime);
        });
    }
    update(deltaTime) {
        const dt = deltaTime / 1000;
        const velocity = 1;
        this.state.players.forEach((player) => {
            const dir = player.target.sub(player.pos).normalize();
            player.pos = player.pos.add(dir.mult(velocity * dt));
            const dHunger = 0.01;
            player.hunger = Math.max(0, player.hunger - dHunger * dt);
            const dSoldier = player.hunger;
            player.soldiers = Math.max(0, player.soldiers - dSoldier * dt);
            // TODO remove @ts-ignore
            // @ts-ignore
            this.state.towns[(0, MyRoomState_1.closestTown)(player.pos, Object.values(this.state.towns.toJSON())).id].dailyRations -= player.soldiers * dt;
        });
    }
    onJoin(client, options) {
        console.log(client.sessionId, 'joined!');
        // create Player instance¬
        const player = new MyRoomState_1.Player();
        // place Player at a random position
        player.pos = randomSpawnPos();
        player.color = randomColor();
        // place player in the map of players by its sessionId
        // (client.sessionId is unique per connection!)
        this.state.players.set(client.sessionId, player);
    }
    onLeave(client, consented) {
        console.log(client.sessionId, 'left!');
        this.state.players.delete(client.sessionId);
    }
    onDispose() {
        console.log('room', this.roomId, 'disposing...');
    }
}
exports.MyRoom = MyRoom;
