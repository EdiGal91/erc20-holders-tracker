import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BalanceDocument = Balance & Document;

@Schema({
  timestamps: true,
  collection: 'balances',
})
export class Balance {
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
    index: true,
  })
  token: string;

  @Prop({
    required: true,
    lowercase: true,
    validate: {
      validator: (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v),
      message: 'Address must be a valid Ethereum address',
    },
    index: true,
  })
  address: string;

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
  { unique: true, name: 'balance_unique' },
);

BalanceSchema.index({ chainId: 1, token: 1 });
BalanceSchema.index({ chainId: 1, address: 1 });
BalanceSchema.index({ address: 1 });
BalanceSchema.index({ createdAt: -1 });
