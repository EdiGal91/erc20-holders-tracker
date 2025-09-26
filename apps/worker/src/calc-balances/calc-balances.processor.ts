import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Balance, BalanceDocument } from '../schemas/balance.schema';
import { Transfer, TransferDocument } from '../schemas/transfer.schema';

@Processor('calc_balances')
export class CalcBalancesProcessor extends WorkerHost {
  private readonly logger = new Logger(CalcBalancesProcessor.name);

  constructor(
    @InjectModel(Balance.name) private balanceModel: Model<BalanceDocument>,
    @InjectModel(Transfer.name) private transferModel: Model<TransferDocument>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { chainId, tokenAddress, address } = job.data;

    try {
      await this.calculateBalance(chainId, tokenAddress, address);

      return {
        processed: true,
        jobId: job.id,
        chainId,
        tokenAddress,
        address,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating balance for ${address} on chain ${chainId}:`,
        error.message,
      );
      throw error;
    }
  }

  private async calculateBalance(
    chainId: number,
    tokenAddress: string,
    address: string,
  ): Promise<void> {
    try {
      // Get all transfers for this address and token
      const [incomingTransfers, outgoingTransfers] = await Promise.all([
        this.transferModel.find({
          chainId,
          token: tokenAddress.toLowerCase(),
          to: address.toLowerCase(),
        }),
        this.transferModel.find({
          chainId,
          token: tokenAddress.toLowerCase(),
          from: address.toLowerCase(),
        }),
      ]);

      // Calculate balances separated by status and track highest block number
      let confirmedIncoming = BigInt(0);
      let pendingIncoming = BigInt(0);
      let confirmedOutgoing = BigInt(0);
      let pendingOutgoing = BigInt(0);
      let highestBlockNumber = 0;

      // Process incoming transfers
      for (const transfer of incomingTransfers) {
        const amount = BigInt(transfer.value);
        highestBlockNumber = Math.max(highestBlockNumber, transfer.blockNumber);

        if (transfer.status === 'confirmed') {
          confirmedIncoming += amount;
        } else {
          pendingIncoming += amount;
        }
      }

      // Process outgoing transfers
      for (const transfer of outgoingTransfers) {
        const amount = BigInt(transfer.value);
        highestBlockNumber = Math.max(highestBlockNumber, transfer.blockNumber);

        if (transfer.status === 'confirmed') {
          confirmedOutgoing += amount;
        } else {
          pendingOutgoing += amount;
        }
      }

      // Calculate net balances
      const confirmedBalance = confirmedIncoming - confirmedOutgoing;
      const pendingBalance = pendingIncoming - pendingOutgoing;

      // Update or create balance record
      await this.balanceModel.findOneAndUpdate(
        {
          chainId,
          token: tokenAddress.toLowerCase(),
          address: address.toLowerCase(),
        },
        {
          confirmed: confirmedBalance.toString(),
          pending: pendingBalance.toString(),
          blockNumber: highestBlockNumber,
        },
        {
          upsert: true,
          new: true,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to calculate balance for ${address}:`,
        error.message,
      );
      throw error;
    }
  }
}
