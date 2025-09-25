import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TokenDocument = Token & Document;

@Schema({
  timestamps: true,
  collection: 'tokens',
})
export class Token {
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
      message: 'Address must be a valid Ethereum address',
    },
  })
  address: string;

  @Prop({
    required: true,
    uppercase: true,
    maxlength: 10,
  })
  symbol: string;

  @Prop({
    required: true,
    min: 0,
    max: 18,
    default: 18,
  })
  decimals: number;

  @Prop({
    default: true,
    index: true,
  })
  enabled: boolean;

  @Prop()
  name?: string;
}

export const TokenSchema = SchemaFactory.createForClass(Token);

TokenSchema.index({ chainId: 1, address: 1 }, { unique: true });
TokenSchema.index({ chainId: 1, enabled: 1 });
TokenSchema.index({ symbol: 1 });
TokenSchema.index({ enabled: 1 });
TokenSchema.index({ createdAt: -1 });
