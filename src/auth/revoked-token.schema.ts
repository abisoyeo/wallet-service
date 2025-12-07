import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class RevokedToken extends Document {
  @Prop({ required: true, index: true, unique: true })
  jti: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const RevokedTokenSchema = SchemaFactory.createForClass(RevokedToken);
