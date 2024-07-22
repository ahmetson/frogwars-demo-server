"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const ethers_1 = require("ethers");
const play_against_ai_1 = __importDefault(require("../abis/play_against_ai"));
const db_1 = require("./db");
const crypto_1 = require("crypto");
const leaderboard_1 = require("./leaderboard");
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const provider = new ethers_1.JsonRpcProvider(process.env.RPC_URL);
const lobby = new ethers_1.Contract(process.env.LOBBY_ADDRESS, play_against_ai_1.default, provider);
app.get("/", (req, res) => {
    res.send("Express + TypeScript Server");
});
app.get("/deposit/:tx", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let result = yield txToDeposited(req.params.tx);
    if (typeof (result) == "string") {
        res.status(400).json({ message: result });
        return;
    }
    const deposited = result;
    try {
        const found = yield ((_a = db_1.collections.versus_deposits) === null || _a === void 0 ? void 0 : _a.findOne({ tx: deposited.tx }));
        // already exists
        if (found !== null) {
            res.status(200).json(found);
            return;
        }
    }
    catch (error) {
        // failed to check
        res.status(500).json(error);
    }
    // put the data
    try {
        const dbResult = yield ((_b = db_1.collections.versus_deposits) === null || _b === void 0 ? void 0 : _b.insertOne(deposited));
        dbResult
            ? res.status(200).json(deposited)
            : res.status(500).json({ message: "Failed to create a new game." });
    }
    catch (error) {
        console.error(error);
        res.status(400).json(error);
    }
}));
// deprecated
app.get("/deposited/:walletAddress", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const deposited = { walletAddress: req.params.walletAddress, win: 0, depositTime: 0 };
    if (!(0, ethers_1.isAddress)(deposited.walletAddress)) {
        res.status(400).json({ message: "Invalid walletAddress" });
        return;
    }
    let playerDeposits = -1;
    try {
        playerDeposits = yield lobby.playerDeposits(deposited.walletAddress);
    }
    catch (e) {
        console.error(e);
        res.json(deposited);
        return;
    }
    let playerAtIndex;
    try {
        playerAtIndex = yield lobby.deposits(playerDeposits);
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ message: "The mismatch of the address its impossible error actually" });
        return;
    }
    if (playerAtIndex == deposited.walletAddress) {
        deposited.win = 0;
    }
    res.json(deposited);
}));
// API name is to just to make sure to hide from users.
// It announces the winner
app.get("/can-end/:session/:win", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let session = req.params.session;
    let win;
    if (req.params.win === "1") {
        win = 1;
    }
    else {
        win = -1;
    }
    let latestDeposit;
    try {
        const found = yield ((_a = db_1.collections.versus_deposits) === null || _a === void 0 ? void 0 : _a.findOne({ session: session }));
        // already exists
        if (found === null) {
            res.status(200).json({ message: "not found by session" });
            return;
        }
        latestDeposit = found;
    }
    catch (error) {
        // failed to check
        res.status(500).json(error);
        return;
    }
    if (latestDeposit.win != 0) {
        res.status(200).json({ message: "updated already" });
        return;
    }
    if (isSessionExpired(latestDeposit.depositTime)) {
        latestDeposit.win = -1;
    }
    else {
        latestDeposit.win = win;
    }
    // If session expired, and nothing was received from the user, then mark user as lost
    latestDeposit.session = undefined;
    const query = { _id: latestDeposit._id };
    const result = yield ((_b = db_1.collections.versus_deposits) === null || _b === void 0 ? void 0 : _b.updateOne(query, { $set: latestDeposit }));
    if (!result) {
        res.status(500).json({ message: "internal error" });
        return;
    }
    if (win > 0) {
        console.log(`Adding a winner to the leaderboard`);
        yield (0, leaderboard_1.addToLeaderboard)(latestDeposit.walletAddress);
    }
    res.status(200).json({});
}));
app.get("/can-start/:walletAddress", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let start = { walletAddress: req.params.walletAddress, canPlay: false };
    let latestDeposit;
    let walletAddress;
    try {
        walletAddress = (0, ethers_1.getAddress)(req.params.walletAddress);
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ e });
        return;
    }
    try {
        const found = yield ((_a = db_1.collections.versus_deposits) === null || _a === void 0 ? void 0 : _a.findOne({ walletAddress: walletAddress }, { sort: { "depositTime": -1 } }));
        // already exists
        if (found === null) {
            res.status(200).json(start);
            return;
        }
        latestDeposit = found;
    }
    catch (error) {
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
    const result = yield ((_b = db_1.collections.versus_deposits) === null || _b === void 0 ? void 0 : _b.updateOne(query, { $set: latestDeposit }));
    if (!result) {
        res.status(500).json({ message: "failed to update the data" });
        return;
    }
    res.status(200).json(start);
}));
// show a leaderboard
// get-leaderboard
app.get("/leaderboard/:walletAddress", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let noUser = {
        walletAddress: req.params.walletAddress,
        rank: 0,
        won: 0,
    };
    let leaderboard = {
        top1: noUser,
        top2: noUser,
        top3: noUser,
        top4: noUser,
        top5: noUser,
        player: noUser,
    };
    let top = yield (0, leaderboard_1.topRanks)();
    if (top === undefined) {
        res.status(500).json({ message: "failed to fetch leaderboard" });
        return;
    }
    let rows = top;
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
    let player = yield (0, leaderboard_1.topRanks)(req.params.walletAddress);
    if (player === undefined) {
        res.status(200).json(leaderboard);
        return;
    }
    leaderboard.player = player;
    res.status(200).json(leaderboard);
}));
(0, db_1.connectToDatabase)()
    .then(() => {
    app.listen(port, () => {
        console.log(`[server]: Server is running at http://localhost:${port}`);
    });
})
    .catch((error) => {
    console.error("Database connection failed", error);
    process.exit();
});
const isSessionExpired = (depositTime) => {
    // For linea
    const timeoutDuration = 200; // 3 minutes + 20 seconds
    const gameEnd = depositTime + timeoutDuration;
    const now = Math.floor(Date.now() / 1000);
    return gameEnd < now;
};
const txToDeposited = (tx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let txReceipt;
    try {
        txReceipt = yield provider.getTransactionReceipt(tx);
    }
    catch (e) {
        console.error(`failed to get tx: ` + e);
        return "failed to get transaction";
    }
    if (txReceipt === null) {
        return "invalid tx";
    }
    if (((_a = txReceipt.to) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== process.env.LOBBY_ADDRESS.toLowerCase()) {
        return "not a lobby transaction";
    }
    let parsedLog = null;
    for (let log of txReceipt.logs) {
        if (log.address.toLowerCase() !== process.env.LOBBY_ADDRESS.toLowerCase()) {
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
    let block = yield provider.getBlock(txReceipt.blockNumber);
    if (block === null) {
        return "Failed to get block time";
    }
    const deposited = {
        walletAddress: parsedLog.args[0],
        win: 0,
        depositTime: block.timestamp,
        tx: txReceipt.hash,
        session: (0, crypto_1.randomUUID)(),
    };
    return deposited;
});
