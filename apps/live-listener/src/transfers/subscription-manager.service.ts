import { Injectable, Logger } from '@nestjs/common';
import { createPublicClient, webSocket, parseAbi, PublicClient } from 'viem';
import { mainnet, arbitrum } from 'viem/chains';

const TRANSFER_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

export interface SubscriptionKey {
  chainId: number;
  tokenAddress: string;
}

interface ActiveSubscription {
  unwatch: () => void;
  chainId: number;
  tokenAddress: string;
}

@Injectable()
export class SubscriptionManagerService {
  private readonly logger = new Logger(SubscriptionManagerService.name);
  private clients = new Map<number, PublicClient>();
  private subscriptions = new Map<string, ActiveSubscription>();

  constructor() {}

  /**
   * Get or create a WebSocket client for the given chain
   */
  private getOrCreateClient(chainId: number): PublicClient | null {
    if (this.clients.has(chainId)) {
      return this.clients.get(chainId)!;
    }

    let client: PublicClient | null = null;

    if (mainnet.id === chainId) {
      client = createPublicClient({
        chain: mainnet,
        transport: webSocket(process.env.INFURA_WS_API_KEY),
      });
    } else if (arbitrum.id === chainId) {
      client = createPublicClient({
        chain: arbitrum,
        transport: webSocket(process.env.INFURA_WS_API_KEY),
      });
    }

    if (client) {
      this.clients.set(chainId, client);
      this.logger.log(`Created WebSocket client for chain ${chainId}`);
    } else {
      this.logger.warn(`Unsupported chain ID: ${chainId}`);
    }

    return client;
  }

  /**
   * Generate a unique key for a subscription
   */
  private getSubscriptionKey(chainId: number, tokenAddress: string): string {
    return `${chainId}:${tokenAddress.toLowerCase()}`;
  }

  /**
   * Subscribe to transfer events for a specific token on a specific chain
   */
  async subscribe(
    chainId: number,
    tokenAddress: string,
    onTransfer: (log: any) => Promise<void>,
  ): Promise<boolean> {
    const key = this.getSubscriptionKey(chainId, tokenAddress);

    // Check if already subscribed
    if (this.subscriptions.has(key)) {
      this.logger.debug(
        `Already subscribed to transfers for token ${tokenAddress} on chain ${chainId}`,
      );
      return true;
    }

    const client = this.getOrCreateClient(chainId);
    if (!client) {
      this.logger.error(
        `Cannot create client for chain ${chainId}, subscription failed`,
      );
      return false;
    }

    try {
      const unwatch = client.watchContractEvent({
        address: tokenAddress as `0x${string}`,
        abi: TRANSFER_ABI,
        eventName: 'Transfer',
        onLogs: async (logs) => {
          for (const log of logs) {
            try {
              await onTransfer(log);
            } catch (error) {
              this.logger.error(
                `Error processing transfer log for ${tokenAddress} on chain ${chainId}:`,
                error.message,
              );
            }
          }
        },
        onError: (error) => {
          this.logger.error(
            `WebSocket error for token ${tokenAddress} on chain ${chainId}:`,
            error.message,
          );
          // Unsubscribe the failed subscription and attempt to reconnect after delay
          this.handleConnectionError(chainId, tokenAddress, onTransfer);
        },
      });

      this.subscriptions.set(key, {
        unwatch,
        chainId,
        tokenAddress: tokenAddress.toLowerCase(),
      });

      this.logger.log(
        `Subscribed to transfers for token ${tokenAddress} on chain ${chainId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to subscribe to transfers for token ${tokenAddress} on chain ${chainId}:`,
        error.message,
      );
      return false;
    }
  }

  /**
   * Unsubscribe from transfer events for a specific token
   */
  unsubscribe(chainId: number, tokenAddress: string): boolean {
    const key = this.getSubscriptionKey(chainId, tokenAddress);
    const subscription = this.subscriptions.get(key);

    if (!subscription) {
      this.logger.debug(
        `No active subscription found for token ${tokenAddress} on chain ${chainId}`,
      );
      return false;
    }

    try {
      subscription.unwatch();
      this.subscriptions.delete(key);
      this.logger.log(
        `Unsubscribed from transfers for token ${tokenAddress} on chain ${chainId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error unsubscribing from token ${tokenAddress} on chain ${chainId}:`,
        error.message,
      );
      return false;
    }
  }

  /**
   * Unsubscribe from all tokens on a specific chain
   */
  unsubscribeChain(chainId: number): number {
    let unsubscribedCount = 0;

    for (const [key, subscription] of this.subscriptions.entries()) {
      if (subscription.chainId === chainId) {
        try {
          subscription.unwatch();
          this.subscriptions.delete(key);
          unsubscribedCount++;
        } catch (error) {
          this.logger.error(`Error unsubscribing from ${key}:`, error.message);
        }
      }
    }

    this.logger.log(
      `Unsubscribed from ${unsubscribedCount} tokens on chain ${chainId}`,
    );

    return unsubscribedCount;
  }

  /**
   * Handle connection errors and attempt reconnection
   */
  private async handleConnectionError(
    chainId: number,
    tokenAddress: string,
    onTransfer: (log: any) => Promise<void>,
  ): Promise<void> {
    const key = this.getSubscriptionKey(chainId, tokenAddress);
    const subscription = this.subscriptions.get(key);

    if (subscription) {
      // Unwatch and remove the failed subscription
      try {
        subscription.unwatch();
      } catch (error) {
        this.logger.debug(
          `Error unwatching failed subscription: ${error.message}`,
        );
      }
      this.subscriptions.delete(key);
    }

    this.logger.warn(
      `Connection lost for token ${tokenAddress} on chain ${chainId}, will attempt reconnection in 2 seconds`,
    );

    // Attempt reconnection after delay
    setTimeout(async () => {
      try {
        const success = await this.subscribe(chainId, tokenAddress, onTransfer);
        if (success) {
          this.logger.log(
            `Successfully reconnected to token ${tokenAddress} on chain ${chainId}`,
          );
        } else {
          this.logger.error(
            `Failed to reconnect to token ${tokenAddress} on chain ${chainId}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error during reconnection for token ${tokenAddress} on chain ${chainId}:`,
          error.message,
        );
      }
    }, 2_000);
  }

  /**
   * Get subscription statistics
   */
  getSubscriptionStats(): {
    totalSubscriptions: number;
    chainCounts: Record<number, number>;
  } {
    const activeSubscriptions = this.getActiveSubscriptions();
    const chainCounts: Record<number, number> = {};

    for (const sub of activeSubscriptions) {
      chainCounts[sub.chainId] = (chainCounts[sub.chainId] || 0) + 1;
    }

    return {
      totalSubscriptions: activeSubscriptions.length,
      chainCounts,
    };
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): SubscriptionKey[] {
    return Array.from(this.subscriptions.values()).map((sub) => ({
      chainId: sub.chainId,
      tokenAddress: sub.tokenAddress,
    }));
  }

  /**
   * Cleanup all subscriptions (useful for shutdown)
   */
  cleanup(): void {
    const totalSubscriptions = this.subscriptions.size;
    let count = 0;

    for (const [key, subscription] of this.subscriptions.entries()) {
      try {
        subscription.unwatch();
        count++;
      } catch (error) {
        this.logger.error(
          `Error cleaning up subscription ${key}:`,
          error.message,
        );
      }
    }

    this.subscriptions.clear();
    this.clients.clear();

    this.logger.log(
      `Cleaned up ${count} of ${totalSubscriptions} subscriptions`,
    );
  }
}
