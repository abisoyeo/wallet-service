import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Wallet extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', unique: true, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  walletNumber: string; // Unique ID for transfers

  @Prop({ default: 0 })
  balance: number; // Stored in minor units (kobo) to avoid float math issues is recommended, but using number for simplicity here.
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
