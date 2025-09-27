import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Chain, ChainDocument } from 'src/schemas/chain.schema';
import { Token, TokenDocument } from 'src/schemas/token.schema';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectModel(Chain.name) private chainModel: Model<ChainDocument>,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS) // Every 5 seconds
  async sync() {
    console.log('**********START************\n');
    const enabledChains = await this.chainModel
      .find({ enabled: true })
      .sort({ chainId: 1 });

    if (enabledChains.length === 0) {
      this.logger.warn('[Cron=sync] No enabled chains found');
      return;
    }

    for (const chain of enabledChains) {
      const enabledTokens = await this.tokenModel
        .find({ chainId: chain.chainId, enabled: true })
        .sort({ symbol: 1 });

      if (enabledTokens.length === 0) {
        this.logger.warn(
          `[Cron=sync] No enabled tokens found for chain ${chain.name}`,
        );
        continue;
      }

      for (const token of enabledTokens) {
        console.log(
          `Syncing transfers for token ${token.symbol} on chain ${chain.name}`,
        );
      }
    }
    console.log('\n**********END************');
  }
}
