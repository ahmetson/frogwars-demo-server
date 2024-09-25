//import http from "http";
import {Room, Client, ClientArray} from "colyseus";
import { GameState, GamePlayer } from "../state/GameState";
import { MsgType } from "../state/PeerMessage";


// https://docs.colyseus.io/server/room/
export class FightingRoom extends Room<GameState> {
    maxClients = 2;

    // (optional) Validate client auth token before joining/creating the room
    /*static async onAuth(token: string, req: http.IncomingMessage): Promise<unknown> {
        
    }*/

    onCreate(_options: any) {
        this.setState(new GameState());
        console.log(`[Game -> Fighting Room]: New room initialized`);

        this.onMessage("ping", (client, _data) => {
            const serverTime = Date.now();
            client.send("pong", {serverTime: serverTime});
        })

        this.onMessage(MsgType.Input, (client, anyData) => {
            this.resendToOthers(MsgType.Input, client.sessionId, anyData);
        })

        this.onMessage(MsgType.SyncRequest, (client, anyData) => {
            this.resendToOthers(MsgType.SyncRequest, client.sessionId, anyData);
        })

        this.onMessage(MsgType.Invalid, (client, _anyData) => {
            this.resendToOthers(MsgType.Invalid, client.sessionId, {});
        })

        this.onMessage(MsgType.SyncReply, (client, anyData) => {
            this.resendToOthers(MsgType.SyncReply, client.sessionId, anyData);
        })

        this.onMessage(MsgType.QualityReport, (client, anyData) => {
            this.resendToOthers(MsgType.QualityReport, client.sessionId, anyData);
        })

        this.onMessage(MsgType.QualityReply, (client, anyData) => {
            this.resendToOthers(MsgType.QualityReply, client.sessionId, anyData);
        })

        this.onMessage(MsgType.KeepAlive, (client, anyData) => {
            this.resendToOthers(MsgType.KeepAlive, client.sessionId, anyData);
        })

        this.onMessage(MsgType.InputAck, (client, anyData) => {
            this.resendToOthers(MsgType.InputAck, client.sessionId, anyData);
        })
    }

    resendToOthers(msgType: MsgType, sessionId: string, anyData: any) {
        this.clients.forEach(connectedClient => {
            if (connectedClient.sessionId !== sessionId) {
                connectedClient.send(msgType, anyData);
            }
        })
    }

    onJoin(client: Client, options: any, auth: any) {
        console.log(`[Game -> Fighting Room]: Client ${client.sessionId} joined the room ${new Date().toUTCString()}`);
        let player = new GamePlayer();
        let joined = options["player"] as GamePlayer;
        player.demonName = joined.demonName;
        player.character = joined.character;
        player.assist = joined.assist;
        player.color = joined.color;
        player.sessionId = client.sessionId;

        this.state.players.set(client.sessionId, player);
    }

    onLeave(client: Client<this["clients"] extends ClientArray<infer U, any> ? U : never, this["clients"] extends ClientArray<infer _, infer U> ? U : never>, consented?: boolean): void | Promise<any> {
        console.log(`[Game -> Fighting Room]: Client ${client.sessionId} left the game ${new Date().toUTCString()}`);
        if (this.state.players.has(client.sessionId)) {
            this.state.players.delete(client.sessionId);
        }   
    }

    onDispose(): void | Promise<any> {
        console.log(`[Game -> Fighting Room]: No more players, room is closed`);
    }
}