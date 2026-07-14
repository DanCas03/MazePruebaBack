import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { LevelNotFoundException } from '../../domain/exceptions/level-not-found.exception';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { UserAlreadyExistsException } from '../../domain/exceptions/user-already-exists.exception';
import { UnsolvableLevelException } from '../../domain/exceptions/unsolvable-level.exception';
import type { DomainErrorBody } from '../contracts/domain-error-body';

// AOP: filtro transversal que traduce excepciones de dominio a respuestas HTTP.
// Sin él, una DomainException no capturada produce un 500 genérico (p.ej.
// LevelNotFoundException debería ser 404). Centralizar aquí mantiene los
// controladores libres de try/catch repetidos.
//
// Contrato de error público (back#3): { statusCode, code, message }, donde
// `code` es el identificador estable de la excepción (LEVEL_NOT_FOUND) —
// los clientes discriminan por él, nunca por el texto de `message`.
//
// OCP: el mapeo se extiende añadiendo entradas al registro, sin tocar el flujo
// de `catch`. Cada subtipo de DomainException no listado cae al default 400
// (entrada de cliente inválida), nunca un 500.
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private static readonly statusByException = new Map<
    new (...args: any[]) => DomainException,
    HttpStatus
  >([
    [LevelNotFoundException, HttpStatus.NOT_FOUND],
    [InvalidCredentialsException, HttpStatus.UNAUTHORIZED],
    [UserAlreadyExistsException, HttpStatus.CONFLICT],
    [UnsolvableLevelException, HttpStatus.UNPROCESSABLE_ENTITY],
  ]);

  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      DomainExceptionFilter.statusByException.get(
        exception.constructor as new (...args: any[]) => DomainException,
      ) ?? HttpStatus.BAD_REQUEST;

    const body: DomainErrorBody = {
      statusCode: status,
      code: exception.code,
      message: exception.message,
    };
    response.status(status).json(body);
  }
}
