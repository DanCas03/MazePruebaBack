// Contrato de error público de las excepciones de dominio (back#3). Vincula
// por compilación el cuerpo que emite DomainExceptionFilter con el esquema
// OpenAPI (ErrorResponseDto lo implementa): renombrar un campo rompe el build
// en ambos sitios en vez de dejar que el contrato servido y el documentado
// diverjan en silencio.
export interface DomainErrorBody {
  statusCode: number;
  code: string;
  message: string;
}
