import type { IScoreRepository } from '../ports/i-score.repository';
import type { ILevelRepository } from '../ports/i-level.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import type {
  GlobalLeaderboard,
  GlobalLeaderboardRow,
} from '../read-models/global-leaderboard';

// Caso de uso: ranking general de jugadores (ADR 0006). Solo campaña; total =
// mejor score / mejores estrellas por nivel. Framework-free, depende de puertos.
export class GetGlobalLeaderboardUseCase {
  static readonly DEFAULT_LIMIT = 50;
  static readonly MAX_LIMIT = 100;

  constructor(
    private readonly scoreRepo: IScoreRepository,
    private readonly levelRepo: ILevelRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    requestingUserId: string,
    limit: number = GetGlobalLeaderboardUseCase.DEFAULT_LIMIT,
  ): Promise<GlobalLeaderboard> {
    const safeLimit = GetGlobalLeaderboardUseCase.clampLimit(limit);
    const levels = await this.levelRepo.findAllOrdered();
    const campaignIds = levels
      .filter((l) => l.section === 'campaign')
      .map((l) => l.id);

    const totals = await this.scoreRepo.findGlobalTotals(campaignIds);
    totals.sort(
      (a, b) => b.totalScore - a.totalScore || b.totalStars - a.totalStars,
    );
    const ranked: GlobalLeaderboardRow[] = totals.map((t, i) => ({
      ...t,
      rank: i + 1,
    }));

    const me = ranked.find((r) => r.userId === requestingUserId) ?? null;
    const top = ranked.slice(0, safeLimit);
    this.logger.log(
      `Global leaderboard: ${ranked.length} players, top ${top.length}`,
      GetGlobalLeaderboardUseCase.name,
    );
    return { top, me };
  }

  // Protege el repositorio de valores fuera de rango (paginación abusiva o
  // basura): límites inválidos caen al default; se acota al máximo permitido.
  private static clampLimit(limit: number): number {
    if (!Number.isInteger(limit) || limit < 1) {
      return GetGlobalLeaderboardUseCase.DEFAULT_LIMIT;
    }
    return Math.min(limit, GetGlobalLeaderboardUseCase.MAX_LIMIT);
  }
}
