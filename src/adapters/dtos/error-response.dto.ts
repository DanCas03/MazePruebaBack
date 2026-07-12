import { ApiProperty } from '@nestjs/swagger';

// Contrato de error público que construye DomainExceptionFilter (back#3).
// Solo documentación OpenAPI: el cuerpo real lo arma el filtro; este DTO
// existe para que cada @ApiResponse de error de dominio apunte al mismo
// esquema en vez de describirlo ad hoc.
export class ErrorResponseDto {
  @ApiProperty({ example: 404, description: 'HTTP status code' })
  statusCode!: number;

  @ApiProperty({
    example: 'LEVEL_NOT_FOUND',
    description:
      'Stable machine-readable error code; clients discriminate on this, never on message',
  })
  code!: string;

  @ApiProperty({
    example: "Level 'level-99' not found",
    description: 'Human-readable detail of the error',
  })
  message!: string;
}
