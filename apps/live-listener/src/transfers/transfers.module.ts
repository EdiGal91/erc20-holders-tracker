import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chain, ChainSchema } from 'src/schemas/chain.schema';
import { Token, TokenSchema } from 'src/schemas/token.schema';
import { Transfer, TransferSchema } from 'src/schemas/transfer.schema';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chain.name, schema: ChainSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Transfer.name, schema: TransferSchema },
    ]),
  ],
  providers: [SchedulerService],
})
export class TransfersModule {}
