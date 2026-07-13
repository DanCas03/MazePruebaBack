import type { IScoreRepository } from '../ports/i-score.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import type { LeaderboardRow } from '../read-models/leaderboard-row';
import { LevelId } from '../../domain/value-objects/level-id.vo';

// Caso de uso: obtiene el ranking de un nivel (ADR 0001, decisión 7).
// Framework-free; depende solo de puertos (DIP).
export class GetLeaderboardUseCase {
  static readonly DEFAULT_LIMIT = 10;
  static readonly MAX_LIMIT = 100;

  constructor(
    private readonly scoreRepo: IScoreRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    rawLevelId: string,
    limit: number = GetLeaderboardUseCase.DEFAULT_LIMIT,
  ): Promise<LeaderboardRow[]> {
    const levelId = new LevelId(rawLevelId);
    const safeLimit = GetLeaderboardUseCase.clampLimit(limit);

    const rows = await this.scoreRepo.findLeaderboard(levelId, safeLimit);
    this.logger.log(
      `Leaderboard for level '${levelId.value}' returned ${rows.length} entries`,
      GetLeaderboardUseCase.name,
    );

    return rows;
  }

  // Protege el repositorio de valores fuera de rango (paginación abusiva o
  // basura): límites inválidos caen al default; se acota al máximo permitido.
  private static clampLimit(limit: number): number {
    if (!Number.isInteger(limit) || limit < 1) {
      return GetLeaderboardUseCase.DEFAULT_LIMIT;
    }
    return Math.min(limit, GetLeaderboardUseCase.MAX_LIMIT);
  }
}
