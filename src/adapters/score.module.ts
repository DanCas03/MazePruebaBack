import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PrismaScoreRepository } from '../infrastructure/database/prisma-score.repository';
import { SubmitScoreUseCase } from '../application/use-cases/submit-score.use-case';
import { GetLeaderboardUseCase } from '../application/use-cases/get-leaderboard.use-case';
import { ScoreController } from './controllers/score.controller';
import { SCORE_REPOSITORY_TOKEN } from '../application/ports/i-score.repository';
import { LOGGER_SERVICE_TOKEN } from '../application/ports/i-logger.service';

@Module({
  // LoggerModule es @Global (ver LevelModule); LOGGER_SERVICE_TOKEN no se
  // re-declara aquí.
  imports: [DatabaseModule],
  providers: [
    { provide: SCORE_REPOSITORY_TOKEN, useClass: PrismaScoreRepository },
    {
      // Use cases framework-free: se instancian con `new`, no con DI de Nest.
      provide: SubmitScoreUseCase,
      useFactory: (repo, logger) => new SubmitScoreUseCase(repo, logger),
      inject: [SCORE_REPOSITORY_TOKEN, LOGGER_SERVICE_TOKEN],
    },
    {
      provide: GetLeaderboardUseCase,
      useFactory: (repo, logger) => new GetLeaderboardUseCase(repo, logger),
      inject: [SCORE_REPOSITORY_TOKEN, LOGGER_SERVICE_TOKEN],
    },
  ],
  controllers: [ScoreController],
})
export class ScoreModule {}
