import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RolloverApiKeyDto {
  @ApiProperty({
    description: 'The ID of the expired key to rollover',
    example: 'some-expired-key-id',
  })
  @IsNotEmpty()
  @IsString()
  expired_key_id: string;

  @ApiProperty({
    description: 'The new expiration time for the API key (e.g., 1H, 1D, 1M, 1Y)',
    example: '1M',
  })
  @IsEnum(['1H', '1D', '1M', '1Y'])
  expiry: string;
}
