import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getOrThrow<string>('REDIS_HOST'),
          port: configService.getOrThrow<number>('REDIS_PORT'),
        },
      }),
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
    BullModule.registerQueue({
      name: 'sync_transfers',
    }),
    BullBoardModule.forFeature({
      name: 'sync_transfers',
      adapter: BullMQAdapter,
    }),
    BullModule.registerQueue({
      name: 'calc_balances',
    }),
    BullBoardModule.forFeature({
      name: 'calc_balances',
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
