import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { Chain, ChainSchema } from 'src/schemas/chain.schema';
import { Token, TokenSchema } from 'src/schemas/token.schema';
import { Transfer, TransferSchema } from 'src/schemas/transfer.schema';
import { SchedulerService } from './scheduler.service';
import { SubscriptionManagerService } from './subscription-manager.service';
import { TransferHandlerService } from './transfer-handler.service';
import { TransfersController } from './transfers.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chain.name, schema: ChainSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Transfer.name, schema: TransferSchema },
    ]),
    BullModule.registerQueue({
      name: 'calc_balances',
    }),
  ],
  controllers: [TransfersController],
  providers: [
    SchedulerService,
    SubscriptionManagerService,
    TransferHandlerService,
  ],
  exports: [
    SchedulerService,
    SubscriptionManagerService,
    TransferHandlerService,
  ],
})
export class TransfersModule {}
