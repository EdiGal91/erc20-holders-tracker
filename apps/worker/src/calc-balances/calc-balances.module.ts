import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { CalcBalancesProcessor } from './calc-balances.processor';
import { Balance, BalanceSchema } from '../schemas/balance.schema';
import { Transfer, TransferSchema } from '../schemas/transfer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Balance.name, schema: BalanceSchema },
      { name: Transfer.name, schema: TransferSchema },
    ]),
    BullModule.registerQueue({
      name: 'calc_balances',
    }),
    BullBoardModule.forFeature({
      name: 'calc_balances',
      adapter: BullMQAdapter,
    }),
  ],
  providers: [CalcBalancesProcessor],
  exports: [BullModule],
})
export class CalcBalancesModule {}
