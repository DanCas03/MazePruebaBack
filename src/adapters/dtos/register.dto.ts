import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'player@arrowmaze.com',
    description: 'Unique email address for the new account',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'player_01',
    minLength: 3,
    maxLength: 20,
    description: 'Unique display name (3-20 chars, letters/digits/underscore)',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9_]+$/, {
    message: 'username must contain only letters, digits, or underscores',
  })
  username!: string;

  @ApiProperty({
    example: 'sup3rs3cret',
    minLength: 8,
    description: 'Plain-text password, at least 8 characters',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
