import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransferDocument = Transfer & Document;

export enum TransferStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
}

@Schema({
  timestamps: true,
  collection: 'transfers',
})
export class Transfer {
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
      message: 'From address must be a valid Ethereum address',
    },
    index: true,
  })
  from: string;

  @Prop({
    required: true,
    lowercase: true,
    validate: {
      validator: (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v),
      message: 'To address must be a valid Ethereum address',
    },
    index: true,
  })
  to: string;

  @Prop({
    required: true,
    type: String, // Store as string to handle big numbers
  })
  value: string;

  @Prop({
    required: true,
    index: true,
  })
  blockNumber: number;

  @Prop({
    required: true,
    lowercase: true,
    validate: {
      validator: (v: string) => /^0x[a-fA-F0-9]{64}$/.test(v),
      message: 'Transaction hash must be a valid Ethereum transaction hash',
    },
    index: true,
  })
  txHash: string;

  @Prop({
    required: true,
  })
  logIndex: number;

  @Prop({
    required: true,
    type: Date,
    index: true,
  })
  timestamp: Date;

  @Prop({
    required: true,
    enum: TransferStatus,
    default: TransferStatus.PENDING,
    index: true,
  })
  status: TransferStatus;
}

export const TransferSchema = SchemaFactory.createForClass(Transfer);

// Compound unique index for idempotency (chainId + txHash + logIndex)
// This ensures we never store the same transfer twice
TransferSchema.index(
  { chainId: 1, txHash: 1, logIndex: 1 },
  { unique: true, name: 'transfer_idempotency' },
);
