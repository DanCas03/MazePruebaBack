import { Injectable, PipeTransform } from '@nestjs/common';
import { InvalidLevelIdException } from '../../domain/exceptions/invalid-level-id.exception';

// Pipe de validación sintáctica del parámetro de ruta :id (back#19). Rechaza
// ids con formato corrupto ANTES de tocar el use case y el repositorio, para
// no gastar un round-trip a la BD en una petición que nunca podría acertar.
//
// El proyecto NO usa UUID/MongoId: un LevelId es un slug curado en minúsculas
// (level-01, l-007) — grupos alfanuméricos separados por guiones. Ese es el
// formato que se valida aquí (CONTEXT-MAP.md wire contract, prisma/levels).
//
// Lanza InvalidLevelIdException (excepción de dominio, no BadRequestException
// de Nest) a propósito: así DomainExceptionFilter la traduce al MISMO cuerpo
// de error uniforme { statusCode: 400, code: INVALID_LEVEL_ID, message } que
// el resto de la API, en vez del cuerpo por defecto de Nest.
@Injectable()
export class LevelIdValidationPipe implements PipeTransform<string, string> {
  // Slug en minúsculas: uno o más grupos [a-z0-9] unidos por guiones simples.
  private static readonly PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  // Cota superior defensiva: ningún id curado se acerca; frena payloads largos.
  private static readonly MAX_LENGTH = 64;

  transform(value: string): string {
    if (
      typeof value !== 'string' ||
      value.length === 0 ||
      value.length > LevelIdValidationPipe.MAX_LENGTH ||
      !LevelIdValidationPipe.PATTERN.test(value)
    ) {
      throw new InvalidLevelIdException(
        `Invalid level id format: '${String(value)}'`,
      );
    }
    return value;
  }
}
