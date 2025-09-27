import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model } from 'mongoose';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Chain, ChainDocument } from '../schemas/chain.schema';
import { Token, TokenDocument } from '../schemas/token.schema';
import { Syncer, SyncerDocument } from '../schemas/syncer.schema';
import {
  Transfer,
  TransferDocument,
  TransferStatus,
} from '../schemas/transfer.schema';
import { EtherscanService } from '../services/etherscan.service';
import { EncryptionService } from '../common/encryption.service';

@Processor('sync_transfers')
export class SyncTransfersProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncTransfersProcessor.name);

  constructor(
    @InjectModel(Chain.name) private chainModel: Model<ChainDocument>,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    @InjectModel(Syncer.name) private syncerModel: Model<SyncerDocument>,
    @InjectModel(Transfer.name) private transferModel: Model<TransferDocument>,
    @InjectQueue('calc_balances') private calcBalancesQueue: Queue,
    private etherscanService: EtherscanService,
    private encryptionService: EncryptionService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { chainId, chainName, tokenAddress, tokenSymbol } = job.data;
    const jobId = job.id;
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    this.logger.log(
      `Processing sync job[${jobId}] for ${tokenSymbol} on chain ${chainName}`,
    );

    try {
      const chain = await this.chainModel
        .findOne({ chainId, enabled: true })
        .select('+apiKey');

      if (!chain) {
        throw new Error(`Chain ${chainId} not found or disabled`);
      }

      const token = await this.tokenModel.findOne({
        chainId,
        address: tokenAddress,
        enabled: true,
      });

      if (!token) {
        throw new Error(
          `Token ${tokenAddress} not found or disabled on chain ${chainId}`,
        );
      }

      await this.syncTransfers(jobId!, chain, token);

      return {
        processed: true,
        chainId,
        chainName,
        tokenAddress,
        tokenSymbol,
      };
    } catch (error) {
      this.logger.error(
        `Error processing sync job for ${tokenSymbol} on chain ${chainName} (${chainId}):`,
        error.message,
      );
      throw error;
    }
  }

  private async syncTransfers(
    jobId: string,
    chain: ChainDocument,
    token: TokenDocument,
  ): Promise<void> {
    if (!chain.apiKey) {
      this.logger.error(
        `No API key found for chain ${chain.name} (${chain.chainId})`,
      );
      throw new Error(
        `No API key found for chain ${chain.name} (${chain.chainId})`,
      );
    }

    const apiKey = this.encryptionService.decrypt(chain.apiKey);

    const latestBlock = await this.etherscanService.getLatestBlockNumber(
      chain.rpcUrl,
      apiKey,
      chain.chainId,
    );

    const fromBlock = await this.getLastScannedBlock(
      chain.chainId,
      token.address,
    );

    const confirmations = chain.confirmations;
    const toBlock = Math.max(0, latestBlock - confirmations);

    this.logger.log(
      `Scanning ${token.symbol} on chain ${chain.name} (${chain.chainId}) from block ${fromBlock} to ${toBlock}`,
    );

    const transferLogs = await this.etherscanService.getTransferLogs(
      chain.rpcUrl,
      apiKey,
      chain.chainId,
      token.address,
      fromBlock,
      toBlock,
      chain.logsRange,
    );

    // Track unique addresses for balance calculation
    const uniqueAddresses = new Set<string>();
    let savedCount = 0;

    for (const log of transferLogs) {
      const transfer = this.etherscanService.parseTransferLog(log);

      try {
        // Use findOneAndUpdate with upsert to handle both new transfers and pending->confirmed updates
        const result = await this.transferModel.findOneAndUpdate(
          {
            chainId: chain.chainId,
            txHash: transfer.transactionHash,
            logIndex: transfer.logIndex,
          },
          {
            $setOnInsert: {
              // These fields are only set when creating a new document
              chainId: chain.chainId,
              token: token.address,
              from: transfer.from,
              to: transfer.to,
              value: transfer.amount,
              blockNumber: transfer.blockNumber,
              txHash: transfer.transactionHash,
              logIndex: transfer.logIndex,
              timestamp: transfer.timestamp,
            },
            $set: {
              // This field is always updated (new or existing)
              status: TransferStatus.CONFIRMED,
            },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          },
        );

        if (result) {
          savedCount++;

          // Add addresses to set for balance calculation (skip zero address)
          const zeroAddress = '0x0000000000000000000000000000000000000000';
          if (transfer.from !== zeroAddress) {
            uniqueAddresses.add(transfer.from.toLowerCase());
          }
          if (transfer.to !== zeroAddress) {
            uniqueAddresses.add(transfer.to.toLowerCase());
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to save/update transfer ${transfer.transactionHash}:${transfer.logIndex}:`,
          error.message,
        );
        throw error;
      }
    }

    this.logger.log(
      `Processed ${transferLogs.length} transfers for ${token.symbol}: ${savedCount} saved/updated`,
    );

    // Add unique addresses to calc_balances queue
    if (uniqueAddresses.size > 0) {
      await this.scheduleBalanceCalculations(
        jobId,
        chain.chainId,
        token.address,
        Array.from(uniqueAddresses),
      );
    }

    // Update syncer cursor with the highest block number processed
    if (transferLogs.length > 0) {
      const maxBlockNumber = Math.max(
        ...transferLogs.map((log) => parseInt(log.blockNumber, 16)),
      );
      await this.updateLastScannedBlock(
        chain.chainId,
        token.address,
        maxBlockNumber,
      );

      this.logger.log(
        `Updated syncer for ${token.symbol} on chain ${chain.chainId}: processed ${transferLogs.length} transfers, cursor updated to block ${maxBlockNumber}`,
      );
    } else {
      this.logger.debug(
        `No transfers found for ${token.symbol} on chain ${chain.chainId}, cursor remains at block ${fromBlock}`,
      );
    }
  }

  private async getLastScannedBlock(
    chainId: number,
    tokenAddress: string,
  ): Promise<number> {
    // Use findOneAndUpdate with upsert to get or create syncer and return lastScannedBlock
    const syncer = await this.syncerModel.findOneAndUpdate(
      {
        chainId,
        token: tokenAddress,
      },
      {
        $setOnInsert: {
          chainId,
          token: tokenAddress,
          lastScannedBlock: 0,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    // Log if it was created (when lastScannedBlock is 0)
    if (syncer.lastScannedBlock === 0) {
      this.logger.log(
        `Created new syncer for token ${tokenAddress} on chain ${chainId}`,
      );
    }

    return syncer.lastScannedBlock;
  }

  private async updateLastScannedBlock(
    chainId: number,
    tokenAddress: string,
    blockNumber: number,
  ): Promise<void> {
    await this.syncerModel.updateOne(
      {
        chainId,
        token: tokenAddress,
      },
      {
        $max: {
          lastScannedBlock: blockNumber,
        },
      },
    );
  }

  private async scheduleBalanceCalculations(
    jobId: string,
    chainId: number,
    tokenAddress: string,
    addresses: string[],
  ): Promise<void> {
    try {
      const jobs = addresses.map((address) => ({
        name: 'calc_balance',
        data: {
          chainId,
          tokenAddress,
          address,
        },
        opts: {
          jobId: `calc_balance_${jobId}_${chainId}_${tokenAddress}_${address}`,
        },
      }));

      await this.calcBalancesQueue.addBulk(jobs);

      this.logger.log(
        `Scheduled balance calculations for ${addresses.length} unique addresses on chain ${chainId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule balance calculations:`,
        error.message,
      );
      // Don't throw here to avoid stopping the entire sync job
    }
  }
}
