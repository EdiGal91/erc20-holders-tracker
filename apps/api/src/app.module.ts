import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChainsModule } from './chains/chains.module';
import { TokensModule } from './tokens/tokens.module';
import { BalancesModule } from './balances/balances.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    ChainsModule,
    TokensModule,
    BalancesModule,
  ],
})
export class AppModule {}
