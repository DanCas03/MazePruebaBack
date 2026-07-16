import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PrismaScoreRepository } from '../infrastructure/database/prisma-score.repository';
import { SubmitScoreUseCase } from '../application/use-cases/submit-score.use-case';
import { GetLeaderboardUseCase } from '../application/use-cases/get-leaderboard.use-case';
import { GetGlobalLeaderboardUseCase } from '../application/use-cases/get-global-leaderboard.use-case';
import { ScoreController } from './controllers/score.controller';
import { SCORE_REPOSITORY_TOKEN } from '../application/ports/i-score.repository';
import { LEVEL_REPOSITORY_TOKEN } from '../application/ports/i-level.repository';
import { LOGGER_SERVICE_TOKEN } from '../application/ports/i-logger.service';
import { LevelModule } from './level.module';

@Module({
  // LoggerModule es @Global (ver logger.module.ts); LOGGER_SERVICE_TOKEN no se
  // re-declara aquí. LevelModule aporta LEVEL_REPOSITORY_TOKEN: SubmitScoreUseCase
  // lo necesita para derivar el score canónico desde las métricas (ADR 0006).
  imports: [DatabaseModule, LevelModule],
  providers: [
    { provide: SCORE_REPOSITORY_TOKEN, useClass: PrismaScoreRepository },
    {
      // Use cases framework-free: se instancian con `new`, no con DI de Nest.
      provide: SubmitScoreUseCase,
      useFactory: (scoreRepo, levelRepo, logger) =>
        new SubmitScoreUseCase(scoreRepo, levelRepo, logger),
      inject: [
        SCORE_REPOSITORY_TOKEN,
        LEVEL_REPOSITORY_TOKEN,
        LOGGER_SERVICE_TOKEN,
      ],
    },
    {
      provide: GetLeaderboardUseCase,
      useFactory: (repo, logger) => new GetLeaderboardUseCase(repo, logger),
      inject: [SCORE_REPOSITORY_TOKEN, LOGGER_SERVICE_TOKEN],
    },
    {
      provide: GetGlobalLeaderboardUseCase,
      useFactory: (scoreRepo, levelRepo, logger) =>
        new GetGlobalLeaderboardUseCase(scoreRepo, levelRepo, logger),
      inject: [
        SCORE_REPOSITORY_TOKEN,
        LEVEL_REPOSITORY_TOKEN,
        LOGGER_SERVICE_TOKEN,
      ],
    },
  ],
  controllers: [ScoreController],
})
export class ScoreModule {}
