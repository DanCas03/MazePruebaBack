import { Injectable, Logger } from '@nestjs/common';
import type { ILoggerService } from '../../application/ports/i-logger.service';

// Adapter: adapta el Logger nativo de NestJS al puerto ILoggerService.
// La capa application nunca importa Logger de @nestjs/common directamente.
@Injectable()
export class NestLoggerAdapter implements ILoggerService {
  private readonly logger = new Logger(NestLoggerAdapter.name);

  log(message: string, context?: string): void {
    this.logger.log(message, context);
  }

  error(message: string, error?: Error, context?: string): void {
    this.logger.error(message, error?.stack, context);
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, context);
  }
}
