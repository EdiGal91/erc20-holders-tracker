import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Chain, ChainDocument } from 'src/schemas/chain.schema';
import { Token, TokenDocument } from 'src/schemas/token.schema';
import { SubscriptionManagerService } from './subscription-manager.service';
import { TransferHandlerService } from './transfer-handler.service';

@Injectable()
export class SchedulerService implements OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private currentEnabledChains = new Set<number>();
  private currentEnabledTokens = new Map<number, Set<string>>(); // chainId -> Set of token addresses
  private running = false;

  constructor(
    @InjectModel(Chain.name) private chainModel: Model<ChainDocument>,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    private subscriptionManager: SubscriptionManagerService,
    private transferHandler: TransferHandlerService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async sync() {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      this.logger.debug('Starting subscription sync check');

      // Get current enabled chains and tokens
      const enabledChains = await this.chainModel
        .find({ enabled: true })
        .sort({ chainId: 1 });

      const newEnabledChains = new Set(enabledChains.map((c) => c.chainId));
      const newEnabledTokens = new Map<number, Set<string>>();

      // Build map of enabled tokens per chain
      for (const chain of enabledChains) {
        const enabledTokens = await this.tokenModel
          .find({ chainId: chain.chainId, enabled: true })
          .sort({ symbol: 1 });

        const tokenAddresses = new Set(
          enabledTokens.map((t) => t.address.toLowerCase()),
        );
        newEnabledTokens.set(chain.chainId, tokenAddresses);
      }

      await this.handleChainChanges(newEnabledChains, newEnabledTokens);

      await this.handleTokenChanges(newEnabledChains, newEnabledTokens);

      // Update current state
      this.currentEnabledChains = newEnabledChains;
      this.currentEnabledTokens = newEnabledTokens;

      this.logger.debug('Subscription sync completed');
    } catch (error) {
      this.logger.error('Error during subscription sync:', error.message);
    } finally {
      this.running = false;
    }
  }

  /**
   * Handle changes in enabled/disabled chains
   */
  private async handleChainChanges(
    newEnabledChains: Set<number>,
    newEnabledTokens: Map<number, Set<string>>,
  ): Promise<void> {
    // Handle newly enabled chains
    for (const chainId of newEnabledChains) {
      if (!this.currentEnabledChains.has(chainId)) {
        this.logger.log(`Chain ${chainId} became enabled`);
        await this.subscribeToChainTokens(
          chainId,
          newEnabledTokens.get(chainId) || new Set(),
        );
      }
    }

    // Handle newly disabled chains
    for (const chainId of this.currentEnabledChains) {
      if (!newEnabledChains.has(chainId)) {
        this.logger.log(`Chain ${chainId} became disabled`);
        const unsubscribedCount =
          this.subscriptionManager.unsubscribeChain(chainId);
        this.logger.log(
          `Unsubscribed from ${unsubscribedCount} tokens on disabled chain ${chainId}`,
        );
      }
    }
  }

  /**
   * Handle changes in enabled/disabled tokens for existing chains
   */
  private async handleTokenChanges(
    newEnabledChains: Set<number>,
    newEnabledTokens: Map<number, Set<string>>,
  ): Promise<void> {
    // Only process chains that exist in both old and new (intersection)
    for (const chainId of this.currentEnabledChains) {
      if (!newEnabledChains.has(chainId)) {
        // Chain is being disabled - already handled in handleChainChanges
        continue;
      }

      const currentTokens = this.currentEnabledTokens.get(chainId) || new Set();
      const newTokens = newEnabledTokens.get(chainId) || new Set();

      // Handle newly enabled tokens on existing chains
      for (const tokenAddress of newTokens) {
        if (!currentTokens.has(tokenAddress)) {
          this.logger.log(
            `Token ${tokenAddress} became enabled on chain ${chainId}`,
          );
          await this.subscribeToToken(chainId, tokenAddress);
        }
      }

      // Handle newly disabled tokens on existing chains
      for (const tokenAddress of currentTokens) {
        if (!newTokens.has(tokenAddress)) {
          this.logger.log(
            `Token ${tokenAddress} became disabled on chain ${chainId}`,
          );
          this.subscriptionManager.unsubscribe(chainId, tokenAddress);
        }
      }
    }
  }

  /**
   * Subscribe to all enabled tokens on a chain
   */
  private async subscribeToChainTokens(
    chainId: number,
    tokenAddresses: Set<string>,
  ): Promise<void> {
    for (const tokenAddress of tokenAddresses) {
      await this.subscribeToToken(chainId, tokenAddress);
    }
  }

  /**
   * Subscribe to transfer events for a specific token
   */
  private async subscribeToToken(
    chainId: number,
    tokenAddress: string,
  ): Promise<void> {
    const success = await this.subscriptionManager.subscribe(
      chainId,
      tokenAddress,
      async (log) => {
        await this.transferHandler.handleTransferEvent(log, chainId);
      },
    );

    if (success) {
      this.logger.log(
        `Successfully subscribed to token ${tokenAddress} on chain ${chainId}`,
      );
    } else {
      this.logger.error(
        `Failed to subscribe to token ${tokenAddress} on chain ${chainId}`,
      );
    }
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    this.logger.log('Cleaning up subscriptions...');
    this.subscriptionManager.cleanup();
  }
}
