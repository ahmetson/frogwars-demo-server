import Moralis from "moralis";
import {EvmChain} from "@moralisweb3/common-evm-utils";
import dotenv from "dotenv";

dotenv.config();

type Metadata = {
    name: string, 
    description: string, 
    image: string
}

export type Nft = {
    id: string;
    name: string;
    image: string;
}

const apiKey = process.env.MORALIS_API_KEY!;
const nftAddr = process.env.NFT_ADDRESS!;
const chain = EvmChain.LINEA;
const thirdwebClientId = process.env.THIRDWEB_CLIENT_ID!;

const ipfsToHttps = (ipfs: string): string => {
    let url = `https://${thirdwebClientId}.ipfscdn.io/ipfs/`;
    return ipfs.replace('ipfs://', url)
}

export const startMoralis = async () => {
    await Moralis.start({
        apiKey: apiKey
    })
}

export const nftsByAddress = async (owner: string) => {
    const nftsBalances  = await Moralis.EvmApi.nft.getWalletNFTs({
        address: owner,
        tokenAddresses: [nftAddr],
        chain: chain,
        limit: 10,
    })

    const nfts = nftsBalances.result.map((nft) => {
        const metadata = JSON.parse(JSON.stringify(nft.result.metadata)) as Metadata;

        return {
            id: nft.result.tokenId,
            name: metadata.name,
            image: ipfsToHttps(metadata.image),
        } as Nft;
    });
    return nfts;
}
