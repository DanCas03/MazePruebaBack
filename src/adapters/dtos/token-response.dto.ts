import { ApiProperty } from '@nestjs/swagger';

// Respuesta canónica de POST /auth/register y POST /auth/login: solo el JWT
// firmado que el cliente debe adjuntar como Bearer token en llamadas posteriores.
export class TokenResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Signed JWT to send as `Authorization: Bearer <token>`',
  })
  token!: string;
}
