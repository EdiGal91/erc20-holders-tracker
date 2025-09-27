import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChainDocument = Chain & Document;

@Schema({
  timestamps: true,
  collection: 'chains',
})
export class Chain {
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  chainId: number;

  @Prop({
    required: true,
    validate: {
      validator: (v: string) => /^https?:\/\/.+/.test(v),
      message: 'RPC URL must be a valid HTTP/HTTPS URL',
    },
  })
  rpcUrl: string;

  @Prop({
    required: true,
    select: false,
  })
  apiKey: string; // encrypted

  @Prop({
    required: true,
    min: 1,
    max: 100,
    default: 12,
  })
  confirmations: number;

  @Prop({
    required: true,
    min: 100,
    max: 10000,
    default: 1000,
  })
  logsRange: number;

  @Prop({
    default: true,
    index: true,
  })
  enabled: boolean;

  @Prop()
  name?: string;

  @Prop()
  symbol?: string;

  @Prop()
  explorerUrl?: string;
}

export const ChainSchema = SchemaFactory.createForClass(Chain);

ChainSchema.index({ chainId: 1 }, { unique: true });
ChainSchema.index({ enabled: 1 });
ChainSchema.index({ createdAt: -1 });
