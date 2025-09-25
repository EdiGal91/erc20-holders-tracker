import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChainsService } from './chains.service';
import { ChainsController } from './chains.controller';
import { Chain, ChainSchema } from './schemas/chain.schema';
import { EncryptionService } from '../common/encryption.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chain.name, schema: ChainSchema }]),
  ],
  controllers: [ChainsController],
  providers: [ChainsService, EncryptionService],
  exports: [ChainsService],
})
export class ChainsModule {}
