import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { GetLevelUseCase } from '../application/use-cases/get-level.use-case';
import { PrismaLevelRepository } from '../infrastructure/database/prisma-level.repository';
import { LevelController } from './controllers/level.controller';
import { LEVEL_REPOSITORY_TOKEN } from '../application/ports/i-level.repository';
import { LOGGER_SERVICE_TOKEN } from '../application/ports/i-logger.service';

@Module({
  // LoggerModule es @Global, por lo que LOGGER_SERVICE_TOKEN está disponible
  // sin re-declararlo aquí (DRY: una sola instancia del adapter en toda la app).
  imports: [DatabaseModule],
  providers: [
    { provide: LEVEL_REPOSITORY_TOKEN, useClass: PrismaLevelRepository },
    {
      // El use case es framework-free: se instancia con `new`, no con DI de Nest.
      provide: GetLevelUseCase,
      useFactory: (repo, logger) => new GetLevelUseCase(repo, logger),
      inject: [LEVEL_REPOSITORY_TOKEN, LOGGER_SERVICE_TOKEN],
    },
  ],
  controllers: [LevelController],
})
export class LevelModule {}
