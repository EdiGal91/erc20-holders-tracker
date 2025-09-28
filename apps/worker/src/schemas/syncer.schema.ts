import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SyncerDocument = Syncer & Document;

@Schema({
  timestamps: true,
  collection: 'syncers',
})
export class Syncer {
  @Prop({
    required: true,
    index: true,
  })
  chainId: number;

  @Prop({
    required: true,
    lowercase: true,
    validate: {
      validator: (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v),
      message: 'Token address must be a valid Ethereum address',
    },
  })
  token: string; // Token contract address

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  lastScannedBlock: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  lastConfirmedBlock: number;
}

export const SyncerSchema = SchemaFactory.createForClass(Syncer);

SyncerSchema.index({ chainId: 1, token: 1 }, { unique: true });
SyncerSchema.index({ chainId: 1 });
SyncerSchema.index({ lastScannedBlock: 1 });
SyncerSchema.index({ lastConfirmedBlock: 1 });
