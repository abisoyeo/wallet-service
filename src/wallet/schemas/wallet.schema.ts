import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Wallet extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', unique: true, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  walletNumber: string;

  @Prop({ default: 0 })
  balance: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
