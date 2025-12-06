import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ApiKey extends Document {
  @Prop({ required: true, index: true }) // Index for fast lookup
  keyPrefix: string;

  @Prop({ required: true })
  serviceName: string;

  @Prop({ required: true })
  keyHash: string; // The hashed version of the full key

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  expiresAt: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
