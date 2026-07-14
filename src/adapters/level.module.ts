import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PrismaLevelRepository } from '../infrastructure/database/prisma-level.repository';
import { GetLevelUseCase } from '../application/use-cases/get-level.use-case';
import { GetSolutionUseCase } from '../application/use-cases/get-solution.use-case';
import { ListLevelsUseCase } from '../application/use-cases/list-levels.use-case';
import { LevelController } from './controllers/level.controller';
import { LEVEL_REPOSITORY_TOKEN } from '../application/ports/i-level.repository';
import { LOGGER_SERVICE_TOKEN } from '../application/ports/i-logger.service';
import { LevelSolver } from '../domain/services/level-solver';

@Module({
  // LoggerModule es @Global (ver logger.module.ts); LOGGER_SERVICE_TOKEN no se
  // re-declara aquí.
  imports: [DatabaseModule],
  providers: [
    { provide: LEVEL_REPOSITORY_TOKEN, useClass: PrismaLevelRepository },
    {
      // Use cases framework-free: se instancian con `new`, no con DI de Nest.
      provide: GetLevelUseCase,
      useFactory: (repo, logger) => new GetLevelUseCase(repo, logger),
      inject: [LEVEL_REPOSITORY_TOKEN, LOGGER_SERVICE_TOKEN],
    },
    {
      provide: ListLevelsUseCase,
      useFactory: (repo, logger) => new ListLevelsUseCase(repo, logger),
      inject: [LEVEL_REPOSITORY_TOKEN, LOGGER_SERVICE_TOKEN],
    },
    // Servicio de dominio puro (ADR 0002): sin estado ni deps, se instancia con
    // `new` como los use cases y se inyecta en GetSolutionUseCase (back#19).
    { provide: LevelSolver, useFactory: () => new LevelSolver() },
    {
      provide: GetSolutionUseCase,
      useFactory: (repo, solver, logger) =>
        new GetSolutionUseCase(repo, solver, logger),
      inject: [LEVEL_REPOSITORY_TOKEN, LevelSolver, LOGGER_SERVICE_TOKEN],
    },
  ],
  controllers: [LevelController],
})
export class LevelModule {}
