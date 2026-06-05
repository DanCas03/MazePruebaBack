import { Injectable, Logger } from '@nestjs/common';
import { ILoggerService } from '../../application/ports/i-logger.service';

/**
 * Adaptador que implementa [ILoggerService] envolviendo el `Logger` de NestJS.
 *
 * Patrón Adapter: `ILoggerService` es el target (contrato interno) y el `Logger`
 * de NestJS es el adaptee. Es el único punto acoplado a la librería de logs.
 */
@Injectable()
export class NestLoggerAdapter implements ILoggerService {
  private readonly logger = new Logger('ArrowMaze');

  log(message: string, context?: string): void {
    this.logger.log(message, context);
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, trace, context);
  }
}
