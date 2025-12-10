import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class RolloverApiKeyDto {
  @IsNotEmpty()
  @IsString()
  expired_key_id: string;

  @IsEnum(['1H', '1D', '1M', '1Y'])
  expiry: string;
}
