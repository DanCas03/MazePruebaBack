import type { ScoreEntry } from '../../domain/entities/score-entry.entity';
import type { LevelId } from '../../domain/value-objects/level-id.vo';
import type { LeaderboardRow } from '../read-models/leaderboard-row';

// Puerto (DIP): contrato de persistencia de puntajes. La capa de aplicación
// depende de esta abstracción; infrastructure la implementa con Prisma.
export interface IScoreRepository {
  save(entry: ScoreEntry): Promise<void>;
  // Devuelve el top `limit` del nivel como filas de lectura (con username
  // resuelto), ordenadas por score desc. El desempate lo decide la impl.
  findLeaderboard(levelId: LevelId, limit: number): Promise<LeaderboardRow[]>;
  // Totales por usuario (mejor score / mejores estrellas por nivel) para los
  // niveles de campaña indicados. Sin orden ni límite: eso lo aplica el caso
  // de uso (GetGlobalLeaderboardUseCase).
  findGlobalTotals(campaignLevelIds: LevelId[]): Promise<
    Array<{
      userId: string;
      username: string;
      totalScore: number;
      totalStars: number;
    }>
  >;
}

export const SCORE_REPOSITORY_TOKEN = 'IScoreRepository';
