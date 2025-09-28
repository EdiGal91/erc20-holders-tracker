import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Syncer, SyncerDocument } from '../schemas/syncer.schema';
import {
  Transfer,
  TransferDocument,
  TransferStatus,
} from '../schemas/transfer.schema';

@Processor('cleanup_reorged')
export class CleanupReorgedProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupReorgedProcessor.name);

  constructor(
    @InjectModel(Syncer.name) private syncerModel: Model<SyncerDocument>,
    @InjectModel(Transfer.name) private transferModel: Model<TransferDocument>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { chainId, chainName, tokenAddress, tokenSymbol } = job.data;

    this.logger.log(
      `Processing cleanup job for ${tokenSymbol} on chain ${chainName}`,
    );

    try {
      await this.cleanupReorgedTransfers(chainId, tokenAddress);

      return {
        processed: true,
        chainId,
        chainName,
        tokenAddress,
        tokenSymbol,
      };
    } catch (error) {
      this.logger.error(
        `Error processing cleanup job for ${tokenSymbol} on chain ${chainName} (${chainId}):`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Clean up pending transfers that were re-orged out of the blockchain.
   * This method checks for pending transfers between lastConfirmedBlock and lastScannedBlock
   * and deletes them since they were not found during the sync process.
   */
  private async cleanupReorgedTransfers(
    chainId: number,
    tokenAddress: string,
  ): Promise<void> {
    try {
      // Get syncer info
      const syncer = await this.syncerModel.findOne({
        chainId,
        token: tokenAddress,
      });

      if (!syncer) {
        this.logger.warn(
          `No syncer found for token ${tokenAddress} on chain ${chainId}`,
        );
        return;
      }

      const { lastConfirmedBlock, lastScannedBlock } = syncer;

      // If lastConfirmedBlock is already up to date with lastScannedBlock, nothing to do
      if (lastConfirmedBlock >= lastScannedBlock) {
        return;
      }

      this.logger.log(
        `Cleaning up re-orged transfers for ${tokenAddress} on chain ${chainId} between blocks ${lastConfirmedBlock} and ${lastScannedBlock}`,
      );

      // Find and delete pending transfers in the range that should have been confirmed
      const deleteResult = await this.transferModel.deleteMany({
        chainId,
        token: tokenAddress,
        status: TransferStatus.PENDING,
        blockNumber: {
          $lt: lastScannedBlock,
        },
      });

      this.logger.log(
        `Deleted ${deleteResult.deletedCount} re-orged pending transfers for ${tokenAddress} on chain ${chainId}`,
      );

      // Update lastConfirmedBlock to lastScannedBlock
      await this.syncerModel.updateOne(
        {
          chainId,
          token: tokenAddress,
        },
        {
          $set: {
            lastConfirmedBlock: lastScannedBlock,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to cleanup re-orged transfers for ${tokenAddress} on chain ${chainId}:`,
        error.message,
      );
      // Don't throw here to avoid stopping other operations
    }
  }
}
