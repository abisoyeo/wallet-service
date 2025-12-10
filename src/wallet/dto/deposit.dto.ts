import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class DepositDto {
  @ApiProperty({
    description: 'The amount to deposit',
    example: 1000,
  })
  @IsNumber()
  @IsPositive()
  amount: number;
}
