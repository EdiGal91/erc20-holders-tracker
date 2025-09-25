import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bullmq';
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
    private etherscanService: EtherscanService,
    private encryptionService: EncryptionService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    console.log('Processing sync_transfers job:', job.id, job.data);

    try {
      // Fetch all enabled chains with API keys
      const enabledChains = await this.chainModel
        .find({ enabled: true })
        .select('+apiKey')
        .sort({ chainId: 1 });

      console.log(`Found ${enabledChains.length} enabled chains`);

      // Process each chain
      for (const chain of enabledChains) {
        // Fetch enabled tokens for this chain
        const enabledTokens = await this.tokenModel
          .find({ chainId: chain.chainId, enabled: true })
          .sort({ symbol: 1 });

        console.log(
          `Chain ${chain.chainId} (${chain.name || 'Unknown'}): ${enabledTokens.length} enabled tokens`,
        );

        // Process each token
        for (const token of enabledTokens) {
          await this.processTokenTransfers(chain, token);
        }
      }

      return {
        processed: true,
        jobId: job.id,
        chainsProcessed: enabledChains.length,
        tokensProcessed: enabledChains.reduce(async (total, chain) => {
          const count = await this.tokenModel.countDocuments({
            chainId: chain.chainId,
            enabled: true,
          });
          return (await total) + count;
        }, Promise.resolve(0)),
      };
    } catch (error) {
      console.error('Error processing sync_transfers job:', error);
      throw error;
    }
  }

  private async processTokenTransfers(
    chain: ChainDocument,
    token: TokenDocument,
  ): Promise<void> {
    try {
      // Get or create syncer record for this chain-token combination
      let syncer = await this.syncerModel.findOne({
        chainId: chain.chainId,
        token: token.address,
      });

      if (!syncer) {
        // Create new syncer record
        syncer = new this.syncerModel({
          chainId: chain.chainId,
          token: token.address,
          lastScannedBlock: 0,
        });
        await syncer.save();
        this.logger.log(
          `Created new syncer for ${token.symbol} (${token.address}) on chain ${chain.chainId}`,
        );
      }

      // Check if API key exists and decrypt it
      if (!chain.apiKey) {
        this.logger.error(`No API key found for chain ${chain.chainId}`);
        return;
      }

      // Decrypt the API key
      const apiKey = this.encryptionService.decrypt(chain.apiKey);

      // Get the latest block number
      // const latestBlock = await this.etherscanService.getLatestBlockNumber(
      //   chain.rpcUrl,
      //   apiKey,
      //   chain.chainId,
      // );

      const fromBlock = syncer.lastScannedBlock;

      // const maxBlocksPerScan = chain.logsRange || 1000;
      const toBlock = 'latest'; //Math.min(fromBlock + maxBlocksPerScan - 1, latestBlock);

      this.logger.log(
        `Scanning ${token.symbol} (${token.address}) on chain ${chain.chainId} from block ${fromBlock} to ${toBlock}`,
      );

      // Fetch transfer logs
      const transferLogs = await this.etherscanService.getTransferLogs(
        chain.rpcUrl,
        apiKey,
        chain.chainId,
        token.address,
        fromBlock,
        toBlock,
        chain.logsRange,
      );

      if (transferLogs.length > 0) {
        this.logger.log(
          `Found ${transferLogs.length} transfer logs for ${token.symbol}`,
        );

        // Process and save each transfer log
        let savedCount = 0;
        let skippedCount = 0;

        for (const log of transferLogs) {
          const transfer = this.etherscanService.parseTransferLog(log);

          try {
            // Convert timestamp from hex to Date
            const timestamp = new Date(parseInt(log.timeStamp, 16) * 1000);

            // Create transfer document
            const transferDoc = new this.transferModel({
              chainId: chain.chainId,
              token: token.address,
              from: transfer.from,
              to: transfer.to,
              value: transfer.amount,
              blockNumber: transfer.blockNumber,
              txHash: transfer.transactionHash,
              logIndex: transfer.logIndex,
              timestamp: timestamp,
              status: TransferStatus.PENDING,
            });

            await transferDoc.save();
            savedCount++;

            this.logger.debug(
              `Saved transfer: ${transfer.amount} ${token.symbol} from ${transfer.from} to ${transfer.to} ` +
                `(block: ${transfer.blockNumber}, tx: ${transfer.transactionHash})`,
            );
          } catch (error) {
            if (error.code === 11000) {
              // Duplicate key error - transfer already exists (idempotency)
              skippedCount++;
              this.logger.debug(
                `Transfer already exists: ${transfer.transactionHash}:${transfer.logIndex}`,
              );
            } else {
              this.logger.error(
                `Failed to save transfer ${transfer.transactionHash}:${transfer.logIndex}:`,
                error.message,
              );
            }
          }
        }

        this.logger.log(
          `Processed ${transferLogs.length} transfers for ${token.symbol}: ${savedCount} saved, ${skippedCount} skipped`,
        );
      }

      // Update syncer with the highest block number processed
      if (transferLogs.length > 0) {
        const maxBlockNumber = Math.max(
          ...transferLogs.map((log) => parseInt(log.blockNumber, 16)),
        );
        syncer.lastScannedBlock = maxBlockNumber;
      }
      await syncer.save();

      this.logger.log(
        `Updated syncer for ${token.symbol} on chain ${chain.chainId}: last scanned block ${syncer.lastScannedBlock}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing transfers for ${token.symbol} on chain ${chain.chainId}:`,
        error.message,
      );
      // Don't throw here to avoid stopping the entire job
    }
  }
}
