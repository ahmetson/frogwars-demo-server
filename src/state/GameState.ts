import { Schema, MapSchema, type } from "@colyseus/schema";

// For the example and hello world
export class GamePlayer extends Schema {
    // DemonData.cs
    @type("string")
    demonName: string = "";
    @type("number")
    character: number = 0;
    @type("number")
    assist: number = 0;
    @type("number")
    color: number = 0;

    // Input synchronization
    // GGPO.cs
    @type("int64")
    input: number = 0;

    // User ID
    @type("string")
    sessionId: string = "";
}

export class GameState extends Schema {
    @type({ map: GamePlayer })
    players = new MapSchema<GamePlayer>();
}
