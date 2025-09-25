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
    select: false, // Don't include in queries by default for security
  })
  apiKey: string; // This will be encrypted

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
  name?: string; // Optional chain name for display

  @Prop()
  symbol?: string; // Optional native token symbol (ETH, BNB, etc.)

  @Prop()
  explorerUrl?: string; // Optional block explorer URL
}

export const ChainSchema = SchemaFactory.createForClass(Chain);

// Add indexes for better query performance
ChainSchema.index({ chainId: 1 }, { unique: true });
ChainSchema.index({ enabled: 1 });
ChainSchema.index({ createdAt: -1 });
