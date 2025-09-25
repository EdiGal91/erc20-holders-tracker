import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { SyncTransfersProcessor } from './sync-transfers.processor';
import { SyncSchedulerService } from './sync-scheduler.service';
import { Chain, ChainSchema } from '../schemas/chain.schema';
import { Token, TokenSchema } from '../schemas/token.schema';
import { Syncer, SyncerSchema } from '../schemas/syncer.schema';
import { Transfer, TransferSchema } from '../schemas/transfer.schema';
import { EtherscanService } from '../services/etherscan.service';
import { EncryptionService } from '../common/encryption.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chain.name, schema: ChainSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Syncer.name, schema: SyncerSchema },
      { name: Transfer.name, schema: TransferSchema },
    ]),
    BullModule.registerQueue({
      name: 'sync_transfers',
    }),
    BullBoardModule.forFeature({
      name: 'sync_transfers',
      adapter: BullMQAdapter,
    }),
  ],
  providers: [
    SyncTransfersProcessor,
    SyncSchedulerService,
    EtherscanService,
    EncryptionService,
  ],
  exports: [BullModule],
})
export class SyncTransfersModule {}
