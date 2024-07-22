"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersusLeaderboard = exports.VersusDeposited = void 0;
// Identical to the Deposited
class VersusDeposited {
    constructor(walletAddress, depositTime, win, session, tx, id) {
        this.walletAddress = walletAddress;
        this.depositTime = depositTime;
        this.win = win;
        this.session = session;
        this.tx = tx;
        this.id = id;
    }
}
exports.VersusDeposited = VersusDeposited;
class VersusLeaderboard {
    constructor(walletAddress, // a user
    won) {
        this.walletAddress = walletAddress;
        this.won = won;
    }
}
exports.VersusLeaderboard = VersusLeaderboard;
