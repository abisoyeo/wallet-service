import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString } from 'class-validator';

export class TransferDto {
  @ApiProperty({
    description: 'The wallet number to transfer to',
    example: '1234567890',
  })
  @IsString()
  wallet_number: string;

  @ApiProperty({
    description: 'The amount to transfer',
    example: 500,
  })
  @IsNumber()
  @IsPositive()
  amount: number;
}
