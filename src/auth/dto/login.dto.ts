import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email',
    example: 'test@example.com',
    format: 'email',
  })
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  password!: string;
}
