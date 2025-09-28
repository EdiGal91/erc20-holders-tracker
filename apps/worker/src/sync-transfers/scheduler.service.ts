import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression, Timeout } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { Model } from 'mongoose';
import { Chain, ChainDocument } from '../schemas/chain.schema';
import { Token, TokenDocument } from '../schemas/token.schema';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectQueue('sync_transfers') private syncTransfersQueue: Queue,
    @InjectQueue('cleanup_reorged') private cleanupReorgedQueue: Queue,
    @InjectModel(Chain.name) private chainModel: Model<ChainDocument>,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
  ) {}

  @Cron('*/15 * * * * *') // Every 15 seconds
  async scheduleAllJobs() {
    // Schedule both sync and cleanup jobs
    await Promise.all([
      this.scheduleJobsForQueue(
        this.syncTransfersQueue,
        'sync_token_transfers',
      ),
      this.scheduleJobsForQueue(
        this.cleanupReorgedQueue,
        'cleanup_reorged_transfers',
      ),
    ]);
  }

  private async scheduleJobsForQueue(
    queue: Queue,
    jobName: string,
  ): Promise<void> {
    try {
      const enabledChains = await this.chainModel.find({ enabled: true });

      if (enabledChains.length === 0) {
        this.logger.warn(
          `[Cron=schedule${jobName}Jobs] No enabled chains found`,
        );
        return;
      }

      for (const chain of enabledChains) {
        const enabledTokens = await this.tokenModel.find({
          chainId: chain.chainId,
          enabled: true,
        });

        if (enabledTokens.length === 0) {
          this.logger.debug(`No enabled tokens found for chain ${chain.name}`);
          continue;
        }

        for (const token of enabledTokens) {
          const jobData = {
            chainId: chain.chainId,
            chainName: chain.name,
            tokenAddress: token.address,
            tokenSymbol: token.symbol,
          };

          await queue.add(jobName, jobData, {
            deduplication: {
              id: `${jobName}_${chain.chainId}_${token.address}`,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Failed to schedule ${jobName} jobs:`, error.message);
    }
  }
}
