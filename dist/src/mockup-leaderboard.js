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
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToLeaderboard = void 0;
// testing the leaderboard with the fake data
const db_1 = require("./db");
const crypto_1 = require("crypto");
// to fetch
// connectToDatabase()
//     .then(async () => {
//         let walletAddress = undefined;
//         let agg = ranks(walletAddress);
//         let cursor = collections.versus_leaderboard?.aggregate(agg);
//         let result = await cursor?.toArray();
//         if (result === undefined) {
//             return [];
//         }
//         let rows = result as LeadboardRow[];
//         console.log(`Top 5 winners:`);
//         console.log(rows);
//         // rank of this user
//         walletAddress = '570986ae'; 
//         agg = ranks(walletAddress);
//         cursor = collections.versus_leaderboard?.aggregate(agg);
//         result = await cursor?.toArray();
//         if (result === undefined) {
//             return [];
//         }
//         rows = result as LeadboardRow[];
//         console.log(`Rank of ${walletAddress}`);
//         console.log(rows[0]);
//         console.log(`Everything is queried!`);
//         process.exit(0);
//     })
//     .catch((error: Error) => {
//         console.error("Database connection failed", error);
//         process.exit();
// });
// to insert
(0, db_1.connectToDatabase)()
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const players = randomPlayers();
    //const players = ['1a923419']; // pick any wallet address in the leaderboard and use it again to see is it updated
    console.log(`Random people (${players.length}): ${players}`);
    const deposits = randomDeposits(players);
    console.log(`Random deposits (${deposits.length})`);
    yield ((_a = db_1.collections.versus_deposits) === null || _a === void 0 ? void 0 : _a.insertMany(deposits));
    console.log(`Random winners were set in the database`);
    for (let player of players) {
        console.log(`Adding a player: ${player} into leaderboard`);
        yield (0, exports.addToLeaderboard)(player);
    }
    console.log(`Everything is added!`);
    process.exit(0);
}))
    .catch((error) => {
    console.error("Database connection failed", error);
    process.exit();
});
const addToLeaderboard = (walletAddress) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const agg = [
        {
            '$match': {
                'walletAddress': walletAddress
            }
        }, {
            '$count': 'won'
        }, {
            '$addFields': {
                'walletAddress': walletAddress,
            }
        }, {
            '$merge': {
                'into': (_a = db_1.collections.versus_leaderboard) === null || _a === void 0 ? void 0 : _a.collectionName,
                'on': 'walletAddress',
                'whenMatched': 'merge',
                'whenNotMatched': 'insert'
            }
        }
    ];
    const cursor = (_b = db_1.collections.versus_deposits) === null || _b === void 0 ? void 0 : _b.aggregate(agg);
    const result = yield cursor.toArray();
    console.log("Aggregated!");
    console.log(result);
});
exports.addToLeaderboard = addToLeaderboard;
const randomPlayers = () => {
    let walletAddresses = new Array();
    let length = (0, crypto_1.randomInt)(1, 10); // players
    for (let i = 0; i < length; i++) {
        let random = (0, crypto_1.randomUUID)().toString().split("-");
        walletAddresses.push(random[0]);
    }
    return walletAddresses;
};
const randomDeposits = (walletAddresses) => {
    let deposits = new Array();
    for (let i = 0; i < walletAddresses.length; i++) {
        const walletAddress = walletAddresses[i];
        deposits = deposits.concat(randomMatches(walletAddress));
    }
    return deposits;
};
const randomMatches = (walletAddress) => {
    let deposits = new Array();
    let length = (0, crypto_1.randomInt)(1, 10); // matches
    for (let i = 0; i < length; i++) {
        let random = (0, crypto_1.randomUUID)().split("-");
        const deposited = {
            walletAddress: walletAddress,
            win: 1,
            depositTime: (0, crypto_1.randomInt)(1000000, 1999999),
            tx: random[1],
            session: random[2],
        };
        deposits.push(deposited);
    }
    return deposits;
};
