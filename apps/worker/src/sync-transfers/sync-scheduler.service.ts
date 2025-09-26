import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression, Timeout } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { Model } from 'mongoose';
import { Chain, ChainDocument } from '../schemas/chain.schema';
import { Token, TokenDocument } from '../schemas/token.schema';

@Injectable()
export class SyncSchedulerService {
  private readonly logger = new Logger(SyncSchedulerService.name);

  constructor(
    @InjectQueue('sync_transfers') private syncTransfersQueue: Queue,
    @InjectModel(Chain.name) private chainModel: Model<ChainDocument>,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
  ) {}

  @Cron('*/15 * * * * *') // Every 15 seconds
  async scheduleSyncJobs() {
    try {
      // Fetch all enabled chains
      const enabledChains = await this.chainModel
        .find({ enabled: true })
        .sort({ chainId: 1 });

      if (enabledChains.length === 0) {
        this.logger.warn('[Cron=scheduleSyncJobs] No enabled chains found');
        return;
      }

      for (const chain of enabledChains) {
        const enabledTokens = await this.tokenModel
          .find({ chainId: chain.chainId, enabled: true })
          .sort({ symbol: 1 });

        if (enabledTokens.length === 0) {
          this.logger.debug(
            `No enabled tokens found for chain ${chain.chainId}`,
          );
          continue;
        }

        for (const token of enabledTokens) {
          const jobData = {
            chainId: chain.chainId,
            tokenAddress: token.address,
            tokenSymbol: token.symbol,
          };

          await this.syncTransfersQueue.add(
            'sync_token_transfers',
            jobData,
            {},
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to schedule sync jobs:', error.message);
    }
  }
}
