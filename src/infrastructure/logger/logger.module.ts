import { Global, Module } from '@nestjs/common';
import { NestLoggerAdapter } from './nest-logger.adapter';
import { LOGGER_SERVICE_TOKEN } from '../../application/ports/i-logger.service';

// Centraliza el binding del puerto ILoggerService -> NestLoggerAdapter en un
// único provider exportado (DRY). Evita duplicar la misma definición en
// cada módulo de feature, que producía dos instancias del adapter.
// @Global: el logger es un concern transversal consumido en toda la app.
@Global()
@Module({
  providers: [{ provide: LOGGER_SERVICE_TOKEN, useClass: NestLoggerAdapter }],
  exports: [LOGGER_SERVICE_TOKEN],
})
export class LoggerModule {}
