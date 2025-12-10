import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/user.schema';
import { KeyEnvironment } from './utils/key-prefix.helper';

@Schema()
export class ApiKey extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: User;

  @Prop({ required: true, index: true })
  keyPrefix: string;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: [String], default: [] })
  permissions: string[]; // e.g., ['deposit', 'read']

  @Prop({
    type: String,
    enum: Object.values(KeyEnvironment),
    default: KeyEnvironment.LIVE,
  })
  environment: KeyEnvironment; // 'live' | 'test'

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

ApiKeySchema.index({ owner: 1, name: 1 }, { unique: true });
