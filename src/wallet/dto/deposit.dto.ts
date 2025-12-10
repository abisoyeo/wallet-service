import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive, Min } from 'class-validator';

export class DepositDto {
  @ApiProperty({
    description: 'The amount to deposit',
    example: 1000,
  })
  @IsInt({ message: 'Amount must be in Kobo (no decimals)' })
  @Min(100)
  @IsPositive()
  amount: number;
}
