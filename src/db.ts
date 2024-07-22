import * as mongoDB from "mongodb";
import dotenv from "dotenv";
import { VersusDeposited, VersusLeaderboard } from "./models";
dotenv.config();

export const collections: { 
    versus_deposits?: mongoDB.Collection<VersusDeposited>,
    versus_leaderboard?: mongoDB.Collection<VersusLeaderboard>
} = {}

export async function connectToDatabase () {
    dotenv.config();
 
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(process.env.DB_CONN_STRING!);
            
    await client.connect();
        
    const db: mongoDB.Db = client.db(process.env.DB_NAME);
   
    const versusDeposistsCollection: mongoDB.Collection<VersusDeposited> = db.collection(process.env.VERSUS_DEPOSITS_COLLECTION_NAME!);
    collections.versus_deposits = versusDeposistsCollection;

    const versusLeaderboardCollection: mongoDB.Collection<VersusLeaderboard> = db.collection(process.env.VERSUS_LEADERBOARD_COLLECTION_NAME!);
    collections.versus_leaderboard = versusLeaderboardCollection;

    collections.versus_leaderboard.createIndex({walletAddress: 1}, {unique: true});

    console.log(`Successfully connected to database: ${db.databaseName} and collection: ${versusDeposistsCollection.collectionName}, ${versusLeaderboardCollection.collectionName}`);
 }