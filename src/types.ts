export type Deposited = {
    walletAddress: string;
    depositTime: number;
    win: number;
    session?: string;
    tx?: string;
}

export type Start = {
    walletAddress: string;
    canPlay: boolean;
}

export type Error = {
    message: string;
}

export type LeadboardRow = {
    walletAddress: string;
    won: number;
    rank: number;
}

export type Leaderboard = {
    top1: LeadboardRow;
    top2: LeadboardRow;
    top3: LeadboardRow;
    top4: LeadboardRow;
    top5: LeadboardRow;
    player: LeadboardRow;
}

export type PrizePool = {
    total: string;
}