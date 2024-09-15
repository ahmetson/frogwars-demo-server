import dotenv from "dotenv";
if (process.env.NODE_ENV && process.env.NODE_ENV!=='production') {
    console.log(`Non production. load the local .env file at the root`);
    dotenv.config();
}
import config from "@colyseus/tools";
import { FightingRoom } from "./game/fighting-room";
import { WebSocketTransport } from "@colyseus/ws-transport"
import { Request, Response, json } from "express"
import cors from "cors";
import { IndexPage } from "./services/main";
import { onDeposit as onDepositAgainstAi, onGameEnd, onGameStart } from "./services/against_ai";
import { onLeaderboard, onPrizePool } from "./services/leaderboard";
import { onNft, onNfts } from "./services/nft";
import { connectToDatabase } from "./db";
import { startMoralis } from "./nft";

export default config({
    options: {
        transport: new WebSocketTransport(),
    },
    initializeGameServer: (gameServer) => {
        gameServer.define('fighting', FightingRoom);
    },
    initializeExpress: (app) => {
        //////////////////////////////////////////
        //
        // Express.js middlewares
        //
        ///////////////////////////////////////////
        app.use(json());
        if (process.env.DISABLE_CORS) {
            console.log(`Cors was disabled! Use it for production!`);
        } else {
            console.warn(`Cors was enabled. Set DISABLE_CORS environment variable to true to disable it`)
            app.use(cors());
        }

        //////////////////////////////////////////
        //
        // ExpressJS custom routes
        //
        ///////////////////////////////////////////
        
        app.get("/", (_req: Request, res: Response) => {
            return res.json(IndexPage);
        });

        app.get("/deposit/:tx", onDepositAgainstAi);

        ////////////////////////////////////////////////////////
        //
        // Play Against AI
        //
        ///////////////////////////////////////////////////////

        // API name is to just to make sure to hide from users.
        // It announces the winner
        app.get("/can-end/:session/:win", onGameEnd)

        app.get("/can-start/:walletAddress", onGameStart);

        ////////////////////////////////////////////////////////
        //
        // Leaderboard
        //
        ///////////////////////////////////////////////////////

        // show a leaderboard
        // get-leaderboard
        app.get("/leaderboard/:walletAddress", onLeaderboard)

        app.get("/prize-pool", onPrizePool);

        ////////////////////////////////////////////////////////
        //
        // Nfts
        //
        ///////////////////////////////////////////////////////

        app.get("/nfts/:walletAddress", onNfts);

        app.get("/nft/:id", onNft)
    },
    beforeListen: async () => {
        try {
            await connectToDatabase()
        } catch (error) {
            console.error("Database connection failed", error);
            process.exit(1);
        }

        try {
            await startMoralis();
        } catch (error) {
            console.error("Failed to connect to moralis", error);
            process.exit(1);
        }
        // ...
    }
});