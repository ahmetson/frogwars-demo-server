"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.collections = void 0;
exports.connectToDatabase = connectToDatabase;
const mongoDB = __importStar(require("mongodb"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.collections = {};
function connectToDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        dotenv_1.default.config();
        const client = new mongoDB.MongoClient(process.env.DB_CONN_STRING);
        yield client.connect();
        const db = client.db(process.env.DB_NAME);
        const versusDeposistsCollection = db.collection(process.env.VERSUS_DEPOSITS_COLLECTION_NAME);
        exports.collections.versus_deposits = versusDeposistsCollection;
        const versusLeaderboardCollection = db.collection(process.env.VERSUS_LEADERBOARD_COLLECTION_NAME);
        exports.collections.versus_leaderboard = versusLeaderboardCollection;
        exports.collections.versus_leaderboard.createIndex({ walletAddress: 1 }, { unique: true });
        console.log(`Successfully connected to database: ${db.databaseName} and collection: ${versusDeposistsCollection.collectionName}, ${versusLeaderboardCollection.collectionName}`);
    });
}
