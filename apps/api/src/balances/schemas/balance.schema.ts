import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BalanceDocument = Balance & Document;

@Schema({
  timestamps: true,
})
export class Balance {
  @Prop({
    required: true,
    index: true,
  })
  chainId: number; // Chain ID where this balance exists

  @Prop({
    required: true,
    type: String,
    lowercase: true,
    index: true,
  })
  token: string; // Token contract address (lowercase)

  @Prop({
    required: true,
    type: String,
    lowercase: true,
    index: true,
  })
  address: string; // Wallet address (lowercase)

  @Prop({
    required: true,
    type: String,
    default: '0',
  })
  confirmed: string; // Confirmed balance (string to handle big numbers)

  @Prop({
    required: true,
    type: String,
    default: '0',
  })
  pending: string; // Pending balance (string to handle big numbers)

  @Prop({
    required: true,
    default: 0,
    index: true,
  })
  blockNumber: number; // Highest block number from processed transfers
}

export const BalanceSchema = SchemaFactory.createForClass(Balance);

BalanceSchema.index(
  { chainId: 1, token: 1, address: 1 },
  { unique: true, name: 'unique_balance' },
);

// Index for efficient top holders queries
BalanceSchema.index(
  { chainId: 1, token: 1, confirmed: -1 },
  { name: 'top_holders' },
);
