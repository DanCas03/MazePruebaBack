import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { GetLevelUseCase } from '../application/use-cases/get-level.use-case';
import { PrismaLevelRepository } from '../infrastructure/database/prisma-level.repository';
import { NestLoggerAdapter } from '../infrastructure/logger/nest-logger.adapter';
import { LevelController } from './controllers/level.controller';
import { LEVEL_REPOSITORY_TOKEN } from '../application/ports/i-level.repository';
import { LOGGER_SERVICE_TOKEN } from '../application/ports/i-logger.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    { provide: LEVEL_REPOSITORY_TOKEN, useClass: PrismaLevelRepository },
    { provide: LOGGER_SERVICE_TOKEN, useClass: NestLoggerAdapter },
    {
      provide: GetLevelUseCase,
      useFactory: (repo, logger) => new GetLevelUseCase(repo, logger),
      inject: [LEVEL_REPOSITORY_TOKEN, LOGGER_SERVICE_TOKEN],
    },
  ],
  controllers: [LevelController],
})
export class LevelModule {}
