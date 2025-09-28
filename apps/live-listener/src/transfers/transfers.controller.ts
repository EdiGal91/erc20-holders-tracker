import { Controller, Get } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SubscriptionManagerService } from './subscription-manager.service';

@Controller('transfers')
export class TransfersController {
  constructor(
    private schedulerService: SchedulerService,
    private subscriptionManager: SubscriptionManagerService,
  ) {}

  @Get('health')
  getHealth() {
    const stats = this.subscriptionManager.getSubscriptionStats();
    const activeSubscriptions =
      this.subscriptionManager.getActiveSubscriptions();

    return {
      status: 'ok',
      subscriptions: {
        total: stats.totalSubscriptions,
        byChain: stats.chainCounts,
        active: activeSubscriptions,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('subscriptions')
  getSubscriptions() {
    return {
      stats: this.subscriptionManager.getSubscriptionStats(),
      subscriptions: this.subscriptionManager.getActiveSubscriptions(),
    };
  }
}
