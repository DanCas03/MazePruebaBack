import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'player@arrowmaze.com',
    description: 'Unique email address for the new account',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'sup3rs3cret',
    minLength: 8,
    description: 'Plain-text password, at least 8 characters',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
