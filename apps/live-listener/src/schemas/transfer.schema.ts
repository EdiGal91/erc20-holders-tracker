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
  token: string;

  @Prop({
    required: true,
    lowercase: true,
    validate: {
      validator: (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v),
      message: 'From address must be a valid Ethereum address',
    },
  })
  from: string;

  @Prop({
    required: true,
    lowercase: true,
    validate: {
      validator: (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v),
      message: 'To address must be a valid Ethereum address',
    },
  })
  to: string;

  @Prop({
    required: true,
    type: String, // Store as string to handle big numbers
  })
  value: string;

  @Prop({
    required: true,
  })
  blockNumber: number;

  @Prop({
    required: true,
    lowercase: true,
    validate: {
      validator: (v: string) => /^0x[a-fA-F0-9]{64}$/.test(v),
      message: 'Transaction hash must be a valid Ethereum transaction hash',
    },
  })
  txHash: string;

  @Prop({
    required: true,
  })
  logIndex: number;

  @Prop({
    required: true,
    type: Date,
  })
  timestamp: Date;

  @Prop({
    required: true,
    enum: TransferStatus,
    default: TransferStatus.PENDING,
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

// For calc-balances (incoming/outgoing)
TransferSchema.index(
  { chainId: 1, token: 1, to: 1 },
  { name: 'by_chain_token_to' },
);
TransferSchema.index(
  { chainId: 1, token: 1, from: 1 },
  { name: 'by_chain_token_from' },
);

// TODO:
// For bulk-confirm step
TransferSchema.index(
  { chainId: 1, status: 1, blockNumber: 1 },
  { name: 'by_chain_status_block' },
);
