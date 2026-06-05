import { Module } from '@nestjs/common';
import { LevelController } from './controllers/level.controller';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PrismaLevelRepository } from '../infrastructure/database/prisma-level.repository';
import { NestLoggerAdapter } from '../infrastructure/logger/nest-logger.adapter';
import { LoggingInterceptor } from '../shared/aspects/logging.interceptor';
import { LEVEL_REPOSITORY } from '../application/ports/i-level.repository';
import { LOGGER_SERVICE } from '../application/ports/i-logger.service';

/**
 * Módulo del feature "niveles". Único lugar donde los tokens de los puertos
 * (DIP) se resuelven a implementaciones concretas. Para cambiar de motor de
 * persistencia bastaría con sustituir `useClass: PrismaLevelRepository`.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [LevelController],
  providers: [
    LoggingInterceptor,
    { provide: LEVEL_REPOSITORY, useClass: PrismaLevelRepository },
    { provide: LOGGER_SERVICE, useClass: NestLoggerAdapter },
  ],
})
export class LevelModule {}
