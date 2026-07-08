import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'player@arrowmaze.com',
    description: 'Email address of the registered account',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'sup3rs3cret',
    description: 'Plain-text password for the account',
  })
  @IsString()
  password!: string;
}
