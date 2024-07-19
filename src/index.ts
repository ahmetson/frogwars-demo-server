import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { isAddress, Contract, JsonRpcProvider } from "ethers";
import LobbyAbi from "../abis/lobby";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

const provider = new JsonRpcProvider(process.env.RPC_URL!);
const lobby = new Contract(process.env.LOBBY_ADDRESS!, LobbyAbi, provider);

type Deposited = {
    walletAddress: string;
    deposited: boolean;
}

type Error = {
    message: string;
}

app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
});

app.get("/deposited/:walletAddress", async (req: Request, res: Response) => {
    const deposited: Deposited = {walletAddress: req.params.walletAddress, deposited: false};

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

    console.log("Player is " + deposited.walletAddress);

    if (playerAtIndex == deposited.walletAddress) {
        deposited.deposited = true;
    }

    res.json(deposited)
});
  
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});