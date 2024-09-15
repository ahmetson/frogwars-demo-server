// FrogWars MadFrog NFT
import { Request, Response } from "express"
import { LeadboardRow, Leaderboard, PrizePool, Start } from "../types";
import { collections  } from "../db";
import { WithId } from "mongodb";
import { VersusDeposited } from "../models";
import { getAddress } from "ethers";
import { startMoralis, nftsByAddress, Nft, nftById } from "../nft";

export const onNfts = async (req: Request, res: Response) => {
    const walletAddress = req.params.walletAddress;

            let nfts: Nft[] = [];
            try {
                nfts = await nftsByAddress(walletAddress);
            } catch (e) {
                console.error(`Error: nftsByAddress('${walletAddress}')`)
                console.error(e);
                
                res.status(500).json({message: 'internal error'})
                return;
            }

            res.status(200).json({nfts: nfts});
}

export const onNft = async(req: Request, res: Response) => {
    const nftId = req.params.id;

    let nft: Nft | undefined = undefined;
    try {
        nft = await nftById(nftId);
    } catch (e) {
        console.error(e);
                
        res.status(500).json({message: 'internal error'})
        return;
    }

    res.status(200).json({nfts: [nft]});
}

