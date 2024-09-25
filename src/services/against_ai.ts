// Play against AI API Endpoint handlers
import { Request, Response } from "express"
import { FrogWarsResponse, clientError, serverError } from "./main";
import { Deposited, Start } from "../types";
import { txToDeposited } from "../blockchain";
import { collections  } from "../db";
import { WithId } from "mongodb";
import { VersusDeposited } from "../models";
import {addToLeaderboard } from "../leaderboard";
import { getAddress } from "ethers";

export type SuccessfulDepositType = FrogWarsResponse & Deposited;

export const onDeposit = async (req: Request, res: Response) => {
    if (!req.params.tx) {
        const data = clientError(`Missing 'txid'`);
        return res.status(data.code).json(data);
    }

    // already exists, just return it
    try {
        const found = await collections.versus_deposits?.findOne({tx: req.params.tx})
        if (found !== null && found !== undefined) {
            const data = (found as Deposited) as SuccessfulDepositType;
            data.code = 200;
            return res.status(data.code).json(found);
        }
    } catch (error) {
        // failed to check
        const data = serverError(JSON.stringify(error))
        return res.status(data.code).json(data);
    }

    let result = await txToDeposited(req.params.tx);

    if (typeof(result) == "string") {
        const data = clientError(`txToDeposited: ${result}`);
        return res.status(data.code).json(data);
    }

    const deposited = result as SuccessfulDepositType;
    deposited.code = 200;

    // put the data
    try {
        const dbResult = await collections.versus_deposits?.insertOne(deposited);

        return dbResult
            ? res.status(200).json(deposited)
            : res.status(500).json({message: "Failed to add a deposit."});
    } catch (error) {
        const data = serverError(JSON.stringify(error))
        return res.status(data.code).json(data);
    }
}

export const onGameEnd = async(req: Request, res: Response) => {
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
}

export const onGameStart = async(req: Request, res: Response) => {
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
}


const isSessionExpired = (depositTime: number): boolean => {
    // For linea
    const timeoutDuration = 200; // 3 minutes + 20 seconds
    const gameEnd = depositTime + timeoutDuration;
    const now = Math.floor(Date.now() / 1000);

    return gameEnd < now;
}
