import { Contract, JsonRpcProvider, TransactionReceipt, LogDescription, TransactionResponse, Block, getAddress } from "ethers";
import { Deposited } from "../types";
import LobbyAbi from "../../abis/play_against_ai";
import { randomUUID } from "crypto";

const provider = new JsonRpcProvider(process.env.RPC_URL!);

// Lobby Smartcontract
console.log(`Blockchain is initialized. Lobby Addr ${process.env.LOBBY_ADDRESS}, provider: ${process.env.RPC_URL}`);
export const lobby = new Contract(process.env.LOBBY_ADDRESS!, LobbyAbi, provider);

export const txToDeposited = async(tx: string): Promise<Deposited | string> => {
    let txReceipt: null | TransactionReceipt;

    try {
        txReceipt = await provider.getTransactionReceipt(tx);
    } catch (e) {
        console.error(`failed to get tx: ` + e);
        return "failed to get transaction";
    }

    if (txReceipt === null) {
        return "invalid tx";
    }
    if (txReceipt.to?.toLowerCase() !== process.env.LOBBY_ADDRESS!.toLowerCase()) {
        return "not a lobby transaction";
    }

    let parsedLog: LogDescription | null = null;

    for (let log of txReceipt.logs) {
        if (log.address.toLowerCase() !== process.env.LOBBY_ADDRESS!.toLowerCase()) {
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
    let block: null | Block = await provider.getBlock(txReceipt.blockNumber);
    if (block === null) {
        return "Failed to get block time"
    }

    const deposited: Deposited = {
        walletAddress: parsedLog.args[1], 
        win: 0, 
        depositTime: block.timestamp,
        tx: txReceipt.hash,
        session: randomUUID(),
    };
    return deposited;
}