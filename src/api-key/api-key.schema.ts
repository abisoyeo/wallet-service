import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ApiKey extends Document {
  @Prop({ required: true, index: true })
  keyPrefix: string;

  @Prop({ required: true, unique: true })
  serviceName: string;

  @Prop({ required: true })
  keyHash: string;

  @Prop({ required: false })
  lastUsed: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  expiresAt: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
