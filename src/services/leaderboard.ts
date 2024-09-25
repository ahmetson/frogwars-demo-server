// Leaderboard API endpoint handlers
import { Request, Response } from "express"
import { LeadboardRow, Leaderboard, PrizePool } from "../types";
import { prizePool, topRanks } from "../leaderboard";

export const onLeaderboard = async (req: Request, res: Response) => {
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
}

export const onPrizePool = async(_req: Request, res: Response) => {
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
}
