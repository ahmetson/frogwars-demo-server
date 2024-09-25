import { Schema, MapSchema, type } from "@colyseus/schema";

// For the example and hello world
export class GamePlayer extends Schema {
    @type("string") demonName: string   = "";
    @type("int32") character: number   = 0;
    @type("int32") assist: number      = 0;
    @type("int32") color: number       = 0;
    @type("string") sessionId: string   = "";
}

export class GameState extends Schema {
    @type({ map: GamePlayer }) players  = new MapSchema<GamePlayer>();
}
