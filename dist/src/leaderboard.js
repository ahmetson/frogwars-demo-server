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
exports.topRanks = exports.ranks = exports.addToLeaderboard = void 0;
// testing the leaderboard with the fake data
const db_1 = require("./db");
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
const ranks = (walletAddress) => {
    const agg = [
        {
            '$setWindowFields': {
                'sortBy': {
                    'won': -1
                },
                'output': {
                    'rank': {
                        '$documentNumber': {}
                    }
                }
            }
        },
    ];
    if (walletAddress !== undefined) {
        agg.push({
            '$match': {
                'walletAddress': walletAddress
            }
        });
    }
    else {
        agg.push({
            '$limit': 5
        });
    }
    return agg;
};
exports.ranks = ranks;
const topRanks = (walletAddress) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let agg = (0, exports.ranks)(walletAddress);
    let cursor = (_a = db_1.collections.versus_leaderboard) === null || _a === void 0 ? void 0 : _a.aggregate(agg);
    let result = yield (cursor === null || cursor === void 0 ? void 0 : cursor.toArray());
    if (result === undefined || result.length == 0) {
        return undefined;
    }
    let rows = result;
    if (walletAddress !== undefined) {
        return rows[0];
    }
    return rows;
});
exports.topRanks = topRanks;
