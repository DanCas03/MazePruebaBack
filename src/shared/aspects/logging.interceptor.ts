import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { LOGGER_SERVICE } from '../../application/ports/i-logger.service';
import type { ILoggerService } from '../../application/ports/i-logger.service';

/**
 * Interceptor de Logging (AOP).
 *
 * Estrategia SOLID:
 * - SRP: su única responsabilidad es registrar entrada/salida/duración. La
 *   lógica de negocio (controladores, casos de uso) queda COMPLETAMENTE limpia,
 *   sin una sola llamada al logger.
 * - DIP: depende de la abstracción [ILoggerService] (inyectada por token), no de
 *   una librería concreta. Se puede sustituir el backend de logs sin tocar este
 *   aspecto ni el negocio.
 * - OCP: aplicar el aspecto a un nuevo endpoint no requiere modificarlo; basta
 *   con declararlo en el módulo/controlador.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(LOGGER_SERVICE) private readonly logger: ILoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const label = `${context.getClass().name}.${context.getHandler().name}`;
    const ctx = 'LoggingInterceptor';

    this.logger.log(`[IN] ${label}`, ctx);

    return next.handle().pipe(
      tap(() =>
        this.logger.log(`[OUT] ${label} (+${Date.now() - start}ms)`, ctx),
      ),
      catchError((err: Error) => {
        this.logger.error(
          `[ERROR] ${label} (+${Date.now() - start}ms): ${err?.message}`,
          err?.stack,
          ctx,
        );
        return throwError(() => err);
      }),
    );
  }
}
