import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { log } from 'console';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.getOrThrow<number>('PORT');

  await app.listen(port, () => {
    console.log(`Worker is running on: http://localhost:${port}`);
    console.log(`Bull Dashboard available at: http://localhost:${port}/queues`);
  });
}
bootstrap();
