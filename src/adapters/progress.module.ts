import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PrismaProgressRepository } from '../infrastructure/database/prisma-progress.repository';
import { SyncProgressUseCase } from '../application/use-cases/sync-progress.use-case';
import { GetProgressUseCase } from '../application/use-cases/get-progress.use-case';
import { ProgressController } from './controllers/progress.controller';
import { PROGRESS_REPOSITORY_TOKEN } from '../application/ports/i-progress.repository';
import { LOGGER_SERVICE_TOKEN } from '../application/ports/i-logger.service';

@Module({
  // LoggerModule es @Global (ver logger.module.ts); LOGGER_SERVICE_TOKEN no se
  // re-declara aquí.
  imports: [DatabaseModule],
  providers: [
    { provide: PROGRESS_REPOSITORY_TOKEN, useClass: PrismaProgressRepository },
    {
      // Use cases framework-free: se instancian con `new`, no con DI de Nest.
      provide: SyncProgressUseCase,
      useFactory: (repo, logger) => new SyncProgressUseCase(repo, logger),
      inject: [PROGRESS_REPOSITORY_TOKEN, LOGGER_SERVICE_TOKEN],
    },
    {
      provide: GetProgressUseCase,
      useFactory: (repo, logger) => new GetProgressUseCase(repo, logger),
      inject: [PROGRESS_REPOSITORY_TOKEN, LOGGER_SERVICE_TOKEN],
    },
  ],
  controllers: [ProgressController],
})
export class ProgressModule {}
