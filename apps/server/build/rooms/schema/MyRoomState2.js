"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyRoomState = exports.Dim = exports.Player = exports.closestTown = exports.Town = exports.Vec = exports.dist = exports.normalize = exports.length = exports.mult = exports.sub = exports.add = void 0;
const schema_1 = require("@colyseus/schema");
const add = (a, b) => new Vec(a.x + b.x, a.y + b.y);
exports.add = add;
const sub = (a, b) => new Vec(a.x - b.x, a.y - b.y);
exports.sub = sub;
const mult = (a, k) => new Vec(a.x * k, a.y * k);
exports.mult = mult;
const length = (a) => Math.sqrt(a.x * a.x + a.y * a.y);
exports.length = length;
const normalize = (a) => (0, exports.mult)(a, 1 / (0, exports.length)(a));
exports.normalize = normalize;
const dist = (a, b) => (0, exports.length)((0, exports.sub)(a, b));
exports.dist = dist;
class Vec extends schema_1.Schema {
    constructor(x = 0, y = 0) {
        super();
        this.x = 0;
        this.y = 0;
        this.x = x;
        this.y = y;
    }
    set(x, y) {
        this.x = x;
        this.y = y;
    }
    copy(v) {
        this.x = v.x;
        this.y = v.y;
    }
    add(v) {
        return new Vec(this.x + v.x, this.y + v.y);
    }
    sub(v) {
        return new Vec(this.x - v.x, this.y - v.y);
    }
    mult(k) {
        return new Vec(this.x * k, this.y * k);
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        return this.mult(1 / this.length());
    }
}
exports.Vec = Vec;
(0, schema_1.defineTypes)(Vec, {
    x: 'number',
    y: 'number',
});
class Town extends schema_1.Schema {
    constructor(obj) {
        super();
        this.pos = new Vec();
        this.name = '';
        this.maxPopulation = 10_000;
        this.population = 10_000;
        this.dailyRations = 365 * 10_000;
        Object.assign(this, obj);
    }
}
exports.Town = Town;
(0, schema_1.defineTypes)(Town, {
    id: 'string',
    pos: Vec,
    name: 'string',
    maxPopulation: 'number',
    population: 'number',
    dailyRations: 'number',
});
const closestTown = (pos, towns) => towns.reduce((acc, town) => {
    const d = (0, exports.dist)(pos, town.pos);
    if (d < acc.dist) {
        return { town, dist: d };
    }
    return acc;
}, {
    town: towns[0],
    dist: (0, exports.dist)(pos, towns[0].pos),
}).town;
exports.closestTown = closestTown;
class Player extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.pos = new Vec();
        this.target = new Vec();
        this.color = '#FFFFFF';
        this.soldiers = 10_000;
        this.hunger = 1;
    }
}
exports.Player = Player;
(0, schema_1.defineTypes)(Player, {
    pos: Vec,
    target: Vec,
    color: 'string',
    soldiers: 'number',
    hunger: 'number',
});
class Dim extends schema_1.Schema {
    constructor(width = 0, height = 0) {
        super();
        this.width = 0;
        this.height = 0;
        this.width = width;
        this.height = height;
    }
}
exports.Dim = Dim;
(0, schema_1.defineTypes)(Dim, {
    width: 'number',
    height: 'number',
});
class MyRoomState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.players = new schema_1.MapSchema();
        this.towns = new schema_1.MapSchema();
    }
}
exports.MyRoomState = MyRoomState;
(0, schema_1.defineTypes)(MyRoomState, {
    size: Dim,
    players: { map: Player },
    towns: { map: Town },
});
