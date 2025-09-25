import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';

@Injectable()
export class SyncSchedulerService {
  constructor(
    @InjectQueue('sync_transfers') private syncTransfersQueue: Queue,
  ) {}

  @Cron('*/15 * * * * *') // Every 15 seconds
  async addSyncTransfersJob() {
    const jobData = {
      timestamp: new Date().toISOString(),
      action: 'sync_transfers',
    };

    await this.syncTransfersQueue.add('sync_transfers', jobData);
  }
}
