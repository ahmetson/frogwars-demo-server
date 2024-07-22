import {ObjectId} from "mongodb";

// Identical to the Deposited
export class VersusDeposited {
    constructor(
        public walletAddress: string, 
        public depositTime: number, 
        public win: number, 
        public session?: string,
        public tx?: string, 
        public id?: ObjectId) {}
}

export class VersusLeaderboard {
    constructor(
        public walletAddress: string,   // a user
        public won: number,
    ) {}
}