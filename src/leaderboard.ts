// testing the leaderboard with the fake data
import { connectToDatabase, collections } from "./db";
import { randomUUID, randomInt } from "crypto";
import { Deposited, LeadboardRow } from "./types";

export const addToLeaderboard = async (walletAddress: string) => {
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
            'into': collections.versus_leaderboard?.collectionName, 
            'on': 'walletAddress', 
            'whenMatched': 'merge', 
            'whenNotMatched': 'insert'
        }
        }
    ];
    const cursor = collections.versus_deposits?.aggregate(agg);
    const result = await cursor!.toArray();

    console.log("Aggregated!");
    console.log(result);
}

export const ranks = (walletAddress: string | undefined): Array<object> => {
    const agg: Array<object> = [
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
        agg.push(
            {
            '$match': {
              'walletAddress': walletAddress
            }
        });
    } else {
        agg.push({
            '$limit': 5
        })
    }

    return agg;
}

export const topRanks = async (walletAddress?: string): Promise<undefined|LeadboardRow|LeadboardRow[]> => {
    let agg = ranks(walletAddress);
    let cursor = collections.versus_leaderboard?.aggregate(agg);
    let result = await cursor?.toArray();

    if (result === undefined || result.length == 0) {
        return undefined;
    }
    let rows = result as LeadboardRow[];

    if (walletAddress !== undefined) {
        return rows[0];
    }
    return rows;
}

