import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import {
  Transfer,
  TransferDocument,
  TransferStatus,
} from '../schemas/transfer.schema';

@Injectable()
export class TransferHandlerService {
  private readonly logger = new Logger(TransferHandlerService.name);

  constructor(
    @InjectModel(Transfer.name) private transferModel: Model<TransferDocument>,
    @InjectQueue('calc_balances') private calcBalancesQueue: Queue,
  ) {}

  /**
   * Schedule balance calculation jobs for the affected addresses
   */
  private async scheduleBalanceCalculations(
    chainId: number,
    tokenAddress: string,
    from: string,
    to: string,
  ): Promise<void> {
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    const addressesToUpdate: string[] = [];

    // Add 'from' address if not zero address
    if (from !== zeroAddress) {
      addressesToUpdate.push(from);
    }

    // Add 'to' address if not zero address and different from 'from'
    if (to !== zeroAddress && to !== from) {
      addressesToUpdate.push(to);
    }

    if (addressesToUpdate.length === 0) {
      return;
    }

    try {
      const jobs = addressesToUpdate.map((address) => ({
        name: 'calc_balance',
        data: {
          chainId,
          tokenAddress,
          address,
        },
        opts: {
          // provide txHash and logIndex
          // jobId: `calc_balance_live_${chainId}_${tokenAddress}_${address}`,
          // Remove duplicate jobs if they exist
          // removeOnComplete: 10,
          // removeOnFail: 5,
        },
      }));

      await this.calcBalancesQueue.addBulk(jobs);

      this.logger.debug(
        `Scheduled balance calculations for ${addressesToUpdate.length} addresses on chain ${chainId}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to schedule balance calculations:',
        error.message,
      );
      // Don't throw here to avoid stopping the transfer processing
    }
  }

  async handleTransferEvent(log: any, chainId: number): Promise<void> {
    try {
      const { args, blockNumber, transactionHash, logIndex, address } = log;
      const from = (args as any).from.toLowerCase();
      const to = (args as any).to.toLowerCase();
      const value = (args as any).value.toString(); // Convert BigInt to string
      const tokenAddress = address.toLowerCase();

      this.logger.debug(
        `Handling transfer event: ${transactionHash}:${logIndex} (${from} -> ${to}, ${value})`,
      );

      const transferData = {
        chainId,
        token: tokenAddress,
        from,
        to,
        value,
        blockNumber: Number(blockNumber),
        txHash: transactionHash.toLowerCase(),
        logIndex: Number(logIndex),
        timestamp: new Date(), // We'll use current time for live events
        status: TransferStatus.PENDING,
      };

      // Try to insert the transfer, ignore if duplicate (due to unique index)
      try {
        const transfer = new this.transferModel(transferData);
        await transfer.save();

        this.logger.debug(
          `Saved transfer: ${transactionHash}:${logIndex} (${from} -> ${to}, ${value})`,
        );

        // Add balance calculation jobs for both addresses (skip zero address)
        await this.scheduleBalanceCalculations(chainId, tokenAddress, from, to);
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error - transfer already exists, this is expected
          this.logger.debug(
            `Transfer already exists: ${transactionHash}:${logIndex}`,
          );
        } else {
          // Some other error
          this.logger.error(
            `Failed to save transfer ${transactionHash}:${logIndex}:`,
            error.message,
          );
          throw error;
        }
      }
    } catch (error) {
      this.logger.error('Error handling transfer event:', error.message);
      throw error;
    }
  }
}
