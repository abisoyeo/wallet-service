import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TransactionType {
  DEPOSIT = 'deposit',
  TRANSFER = 'transfer',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({ required: true, enum: TransactionType })
  type: string;

  @Prop({ required: true })
  amount: number;

  @Prop({
    required: true,
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: string;

  @Prop()
  recipientWalletNumber?: string;

  @Prop()
  senderWalletNumber?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
