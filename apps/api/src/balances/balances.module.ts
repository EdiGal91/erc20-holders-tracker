import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BalancesController } from './balances.controller';
import { BalancesService } from './balances.service';
import { Balance, BalanceSchema } from './schemas/balance.schema';
import { Token, TokenSchema } from '../tokens/schemas/token.schema';
import { Chain, ChainSchema } from '../chains/schemas/chain.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Balance.name, schema: BalanceSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Chain.name, schema: ChainSchema },
    ]),
  ],
  controllers: [BalancesController],
  providers: [BalancesService],
})
export class BalancesModule {}
