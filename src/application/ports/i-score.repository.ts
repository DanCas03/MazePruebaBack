import type { ScoreEntry } from '../../domain/entities/score-entry.entity';
import type { LevelId } from '../../domain/value-objects/level-id.vo';

// Puerto (DIP): contrato de persistencia de puntajes. La capa de aplicación
// depende de esta abstracción; infrastructure la implementa con Prisma.
export interface IScoreRepository {
  save(entry: ScoreEntry): Promise<void>;
  // Devuelve los mejores `limit` puntajes de un nivel, ordenados de mayor a
  // menor score. El orden de desempate es responsabilidad de la implementación.
  findTopByLevel(levelId: LevelId, limit: number): Promise<ScoreEntry[]>;
}

export const SCORE_REPOSITORY_TOKEN = 'IScoreRepository';
