// testing the leaderboard with the fake data
import { connectToDatabase, collections } from "./db";
import { randomUUID, randomInt } from "crypto";
import { Deposited } from "./types";

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
connectToDatabase()
    .then(async () => {
        
        const players = randomPlayers();
        //const players = ['1a923419']; // pick any wallet address in the leaderboard and use it again to see is it updated

        console.log(`Random people (${players.length}): ${players}`);
        const deposits = randomDeposits(players);
        console.log(`Random deposits (${deposits.length})`);
        await collections.versus_deposits?.insertMany(deposits);
        console.log(`Random winners were set in the database`);

        for (let player of players) {
            console.log(`Adding a player: ${player} into leaderboard`);
            await addToLeaderboard(player);
        }
        console.log(`Everything is added!`);
        process.exit(0);
    })
    .catch((error: Error) => {
        console.error("Database connection failed", error);
        process.exit();
});

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


const randomPlayers = (): Array<string> => {
    let walletAddresses = new Array<string>();
    let length = randomInt(1, 10); // players
    for (let i = 0; i < length; i++) {
        let random = randomUUID().toString().split("-");
        walletAddresses.push(random[0]);
    }

    return walletAddresses;
}

const randomDeposits = (walletAddresses: Array<string>): Array<Deposited> => {
    let deposits = new Array<Deposited>();
    for (let i = 0; i < walletAddresses.length; i++) {
        const walletAddress = walletAddresses[i];
        deposits = deposits.concat(randomMatches(walletAddress));
    }

    return deposits;
}

const randomMatches = (walletAddress: string): Array<Deposited> => {
    let deposits = new Array<Deposited>();
    let length = randomInt(1, 10); // matches
    for (let i = 0; i < length; i++) {
        let random = randomUUID().split("-");
        const deposited: Deposited = {
            walletAddress: walletAddress, 
            win: 1, 
            depositTime: randomInt(1000000, 1999999),
            tx: random[1],
            session: random[2],
        };

        deposits.push(deposited)
    }

    return deposits;
}