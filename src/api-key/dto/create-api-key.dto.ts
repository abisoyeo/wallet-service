import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { KeyEnvironment } from '../utils/key-prefix.helper';

export class CreateApiKeyDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @IsEnum(['1H', '1D', '1M', '1Y'], {
    message: 'Expiry must be 1H, 1D, 1M, or 1Y',
  })
  expiry: string;

  @IsOptional()
  @IsEnum(KeyEnvironment)
  environment?: KeyEnvironment;
}
