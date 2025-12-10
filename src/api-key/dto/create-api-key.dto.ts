import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
} from 'class-validator';
import { KeyEnvironment } from '../utils/key-prefix.helper';
import { ApiProperty } from '@nestjs/swagger';
import { ALLOWED_PERMISSIONS } from '../../common/constants/permissions.constant';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'A descriptive name for the API key',
    example: 'My Test Key',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'A list of permissions for the API key',
    example: ['read', 'deposit', 'transfer'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsIn(ALLOWED_PERMISSIONS, {
    each: true,
    message: `Each permission must be one of the following: ${ALLOWED_PERMISSIONS.join(
      ', ',
    )}`,
  })
  permissions: string[];

  @ApiProperty({
    description: 'The expiration time for the API key (e.g., 1H, 1D, 1M, 1Y)',
    example: '1D',
  })
  @IsEnum(['1H', '1D', '1M', '1Y'], {
    message: 'Expiry must be 1H, 1D, 1M, or 1Y',
  })
  expiry: string;

  @ApiProperty({
    description: 'The environment for the API key',
    example: KeyEnvironment.TEST,
    enum: KeyEnvironment,
    required: false,
  })
  @IsOptional()
  @IsEnum(KeyEnvironment)
  environment?: KeyEnvironment;
}
