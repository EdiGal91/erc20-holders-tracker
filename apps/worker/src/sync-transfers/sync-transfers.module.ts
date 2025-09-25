import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { SyncTransfersProcessor } from './sync-transfers.processor';
import { SyncSchedulerService } from './sync-scheduler.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'sync_transfers',
    }),
    BullBoardModule.forFeature({
      name: 'sync_transfers',
      adapter: BullMQAdapter,
    }),
  ],
  providers: [SyncTransfersProcessor, SyncSchedulerService],
  exports: [BullModule],
})
export class SyncTransfersModule {}
