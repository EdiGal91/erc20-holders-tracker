import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface EtherscanTransferLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  blockHash: string;
  timeStamp: string;
  gasPrice: string;
  gasUsed: string;
  logIndex: string;
  transactionHash: string;
  transactionIndex: string;
}

export interface EtherscanLogsResponse {
  status: string;
  message: string;
  result: EtherscanTransferLog[];
}

@Injectable()
export class EtherscanService {
  private readonly logger = new Logger(EtherscanService.name);

  // ERC20 Transfer event signature: Transfer(address,address,uint256)
  private readonly TRANSFER_TOPIC =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

  async getTransferLogs(
    rpcUrl: string,
    apiKey: string,
    chainId: number,
    tokenAddress: string,
    fromBlock: number,
    toBlock: number | 'latest' = 'latest',
    offset: number,
    page: number = 1,
  ): Promise<EtherscanTransferLog[]> {
    try {
      // Build the Etherscan API URL
      const url = new URL(rpcUrl);
      url.searchParams.set('chainid', chainId.toString());
      url.searchParams.set('module', 'logs');
      url.searchParams.set('action', 'getLogs');
      url.searchParams.set('address', tokenAddress);
      url.searchParams.set('topic0', this.TRANSFER_TOPIC);
      url.searchParams.set('fromBlock', fromBlock.toString());
      url.searchParams.set('toBlock', toBlock.toString());
      url.searchParams.set('page', page.toString());
      url.searchParams.set('offset', offset.toString());
      url.searchParams.set('apikey', apiKey);

      this.logger.debug(
        `Fetching transfers for ${tokenAddress} on chain ${chainId} from block ${fromBlock}`,
      );

      const response = await axios.get<EtherscanLogsResponse>(url.toString(), {
        timeout: 30000, // 30 second timeout
      });

      if (response.data.status !== '1') {
        throw new Error(`Etherscan API error: ${response.data.message}`);
      }

      this.logger.debug(
        `Found ${response.data.result.length} transfer logs for ${tokenAddress}`,
      );

      return response.data.result;
    } catch (error) {
      this.logger.error(
        `Failed to fetch transfer logs for ${tokenAddress}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Parse transfer log to extract from, to, and amount
   */
  parseTransferLog(log: EtherscanTransferLog): {
    from: string;
    to: string;
    amount: string;
    blockNumber: number;
    transactionHash: string;
    logIndex: number;
  } {
    // topics[1] = from address (padded to 32 bytes)
    // topics[2] = to address (padded to 32 bytes)
    // data = amount (hex)

    const from = '0x' + log.topics[1].slice(-40); // Remove padding, keep last 40 chars
    const to = '0x' + log.topics[2].slice(-40); // Remove padding, keep last 40 chars
    const amount = log.data; // Already in hex format

    return {
      from,
      to,
      amount,
      blockNumber: parseInt(log.blockNumber, 16),
      transactionHash: log.transactionHash,
      logIndex: parseInt(log.logIndex, 16),
    };
  }

  /**
   * Get the latest block number from the chain
   */
  async getLatestBlockNumber(
    rpcUrl: string,
    apiKey: string,
    chainId: number,
  ): Promise<number> {
    try {
      const url = new URL(rpcUrl);
      url.searchParams.set('chainid', chainId.toString());
      url.searchParams.set('module', 'proxy');
      url.searchParams.set('action', 'eth_blockNumber');
      url.searchParams.set('apikey', apiKey);

      const response = await axios.get(url.toString());

      if (response.data.error) {
        throw new Error(`Etherscan API error: ${response.data.error.message}`);
      }

      return parseInt(response.data.result, 16);
    } catch (error) {
      this.logger.error(
        `Failed to get latest block number for chain ${chainId}:`,
        error.message,
      );
      throw error;
    }
  }
}
