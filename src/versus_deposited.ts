import {ObjectId} from "mongodb";

// Identical to the Deposited
export default class Deposited {
    constructor(
        public walletAddress: string, 
        public depositTime: number, 
        public win: number, 
        public session?: string,
        public tx?: string, 
        public id?: ObjectId) {}
}