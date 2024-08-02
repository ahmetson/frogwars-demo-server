import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { isAddress, Contract, JsonRpcProvider, TransactionReceipt, LogDescription, TransactionResponse, Block, getAddress } from "ethers";
import LobbyAbi from "../abis/play_against_ai";
import { collections, connectToDatabase  } from "./db";
import { VersusDeposited } from "./models";
import { WithId } from "mongodb";
import { randomUUID } from "crypto";
import { Deposited, LeadboardRow, Leaderboard, PrizePool, Start } from "./types";
import {addToLeaderboard, topRanks, prizePool} from "./leaderboard";
import { startMoralis, nftsByAddress, Nft, nftById } from "./nft";
import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const provider = new JsonRpcProvider(process.env.RPC_URL!);
const lobby = new Contract(process.env.LOBBY_ADDRESS!, LobbyAbi, provider);

app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
});

app.get("/deposit/:tx", async (req:Request, res: Response) => {
    let result = await txToDeposited(req.params.tx);


    if (typeof(result) == "string") {
        res.status(400).json({message: result});
        return;
    }

    const deposited = result as Deposited;

    try {
        const found = await collections.versus_deposits?.findOne({tx: deposited.tx})
        // already exists
        if (found !== null) {
            res.status(200).json(found as Deposited);
            return;
        }
    } catch (error) {
        // failed to check
        res.status(500).json(error);
    }

    // put the data
    try {
        const dbResult = await collections.versus_deposits?.insertOne(deposited);

        dbResult
            ? res.status(200).json(deposited)
            : res.status(500).json({message: "Failed to create a new game."});
    } catch (error) {
        console.error(error);
        res.status(400).json(error);
    }
});

// deprecated
app.get("/deposited/:walletAddress", async (req: Request, res: Response) => {
    const deposited: Deposited = {walletAddress: req.params.walletAddress, win: 0, depositTime: 0};

    if (!isAddress(deposited.walletAddress)) {
        res.status(400).json({message: "Invalid walletAddress"});
        return;
    }

    let playerDeposits: number = -1;

    try {
        playerDeposits = await lobby.playerDeposits(deposited.walletAddress)
    } catch (e) {
        console.error(e);
        res.json(deposited);
        return;
    }

    let playerAtIndex: any;
    try {
        playerAtIndex = await lobby.deposits(playerDeposits);
    } catch (e) {
        console.error(e);
        res.status(400).json({message: "The mismatch of the address its impossible error actually"});
        return;
    }

    if (playerAtIndex == deposited.walletAddress) {
        deposited.win = 0;
    }

    res.json(deposited)
});

// API name is to just to make sure to hide from users.
// It announces the winner
app.get("/can-end/:session/:win", async(req: Request, res: Response) => {
    let session: string = req.params.session;
    let win: number;

    if (req.params.win === "1") {
        win = 1;
    } else {
        win = -1;
    }

    let latestDeposit: WithId<VersusDeposited>;

    try {
        const found = await collections.versus_deposits?.findOne({session: session})
        // already exists
        if (found === null) {
            res.status(200).json({message: "not found by session"});
            return;
        } 
        latestDeposit = found as WithId<VersusDeposited>;
    } catch (error) {
        // failed to check
        res.status(500).json(error);
        return;
    }

    if (latestDeposit.win != 0) {
        res.status(200).json({message: "updated already"});
        return;
    }
    
    if (isSessionExpired(latestDeposit.depositTime)) {
        latestDeposit.win = -1;
    } else {
        latestDeposit.win = win;
    }

    // If session expired, and nothing was received from the user, then mark user as lost
    latestDeposit.session = undefined;
    const query = { _id: latestDeposit._id };
      
    const result = await collections.versus_deposits?.updateOne(query, { $set: latestDeposit });

    if (!result) {
        res.status(500).json({message: "internal error"});
        return;
    }

    if (win > 0) {
        console.log(`Adding a winner to the leaderboard`);
        await addToLeaderboard(latestDeposit.walletAddress);
    }

    res.status(200).json({});
})

app.get("/can-start/:walletAddress", async (req: Request, res: Response) => {
    let start: Start = {walletAddress: req.params.walletAddress, canPlay: false};

    let latestDeposit: WithId<VersusDeposited>;

    let walletAddress: string;
    try {
        walletAddress = getAddress(req.params.walletAddress)
    } catch(e) {
        console.error(e);
        res.status(400).json({e});
        return;
    }
    try {
        const found = await collections.versus_deposits?.findOne({walletAddress: walletAddress}, {sort: {"depositTime": -1}})
        // already exists
        if (found === null) {
            res.status(200).json(start);
            return;
        } 
        latestDeposit = found as WithId<VersusDeposited>;
    } catch (error) {
        // failed to check
        res.status(500).json(error);
        return;
    }

    if (latestDeposit.win != 0) {
        res.status(200).json(start);
        return;
    }
        
    if (!isSessionExpired(latestDeposit.depositTime)) {
        start.canPlay = true;
        res.status(200).json(start);
        return;
    }

    // If session expired, and nothing was received from the user, then mark user as lost
    latestDeposit.win = -1;
    latestDeposit.session = undefined;
    const query = { _id: latestDeposit._id };
      
    const result = await collections.versus_deposits?.updateOne(query, { $set: latestDeposit });

    if (!result) {
        res.status(500).json({message: "failed to update the data"});
        return;
    }

    res.status(200).json(start);
});

// show a leaderboard
// get-leaderboard
app.get("/leaderboard/:walletAddress", async (req: Request, res: Response) => {
    let noUser: LeadboardRow = {
        walletAddress: req.params.walletAddress,
        rank: 0,
        won: 0,
    }

    let leaderboard: Leaderboard = {
        top1: noUser,
        top2: noUser,
        top3: noUser,
        top4: noUser,
        top5: noUser,
        player: noUser,
    }

    let top = await topRanks();
    if (top === undefined) {
        res.status(500).json({message: "failed to fetch leaderboard"});
        return;
    }
    let rows = top as LeadboardRow[];
    if (rows.length > 0) {
        leaderboard.top1 = rows[0];
    }
    if (rows.length > 1) {
        leaderboard.top2 = rows[1];
    }
    if (rows.length > 2) {
        leaderboard.top3 = rows[2];
    }
    if (rows.length > 3) {
        leaderboard.top4 = rows[3];
    }
    if (rows.length > 4) {
        leaderboard.top5 = rows[4];
    }

    let player = await topRanks(req.params.walletAddress);
    if (player === undefined) {
        res.status(200).json(leaderboard);
        return;
    }
    leaderboard.player = player as LeadboardRow;


    res.status(200).json(leaderboard);
})

app.get("/prize-pool", async (req: Request, res: Response) => {
    let data: PrizePool = {
        total: "0",
    };

    try {
        data.total = await prizePool();
    } catch (e) {
        console.error(e);
        res.status(400).json({message: 'internal error'});
        return;
    }

    res.status(200).json(data);
});

app.get("/nfts/:walletAddress", async (req: Request, res: Response) => {
    const walletAddress = req.params.walletAddress;

    let nfts: Nft[] = [];
    try {
        nfts = await nftsByAddress(walletAddress);
    } catch (e) {
        console.error(`Error: nftsByAddress('${walletAddress}')`)
        console.error(e);
        
        res.status(500).json({message: 'internal error'})
        return;
    }

    res.status(200).json({nfts: nfts});
})

app.get("/nft/:id", async (req: Request, res: Response) => {
    const nftId = req.params.id;

    let nft: Nft | undefined = undefined;
    try {
        nft = await nftById(nftId);
    } catch (e) {
        console.error(e);
        
        res.status(500).json({message: 'internal error'})
        return;
    }

    res.status(200).json({nfts: [nft]});
})

connectToDatabase()
    .then(async () => {
        await startMoralis();

        app.listen(port, () => {
            console.log(`[server]: Server is running at http://localhost:${port}`);
        });
    })
    .catch((error: Error) => {
        console.error("Database connection failed", error);
        process.exit();
    });

const isSessionExpired = (depositTime: number): boolean => {
    // For linea
    const timeoutDuration = 200; // 3 minutes + 20 seconds
    const gameEnd = depositTime + timeoutDuration;
    const now = Math.floor(Date.now() / 1000);

    return gameEnd < now;
}

const txToDeposited = async(tx: string): Promise<Deposited | string> => {
    let txReceipt: null | TransactionReceipt;

    try {
        txReceipt = await provider.getTransactionReceipt(tx);
    } catch (e) {
        console.error(`failed to get tx: ` + e);
        return "failed to get transaction";
    }

    if (txReceipt === null) {
        return "invalid tx";
    }
    if (txReceipt.to?.toLowerCase() !== process.env.LOBBY_ADDRESS!.toLowerCase()) {
        return "not a lobby transaction";
    }

    let parsedLog: LogDescription | null = null;

    for (let log of txReceipt.logs) {
        if (log.address.toLowerCase() !== process.env.LOBBY_ADDRESS!.toLowerCase()) {
            continue;
        }
        parsedLog = lobby.interface.parseLog(log);
        if (parsedLog === null) {
            continue;
        }
        if (parsedLog.name !== "Deposit") {
            parsedLog = null;
            continue;
        }
    }

    if (parsedLog === null) {
        return "invalid event";
    }

    // now getting a time
    let block: null | Block = await provider.getBlock(txReceipt.blockNumber);
    if (block === null) {
        return "Failed to get block time"
    }

    const deposited: Deposited = {
        walletAddress: parsedLog.args[1], 
        win: 0, 
        depositTime: block.timestamp,
        tx: txReceipt.hash,
        session: randomUUID(),
    };
    return deposited;
}