import type { ScoreEntry } from '../../domain/entities/score-entry.entity';
import type { LeaderboardRow } from '../../application/read-models/leaderboard-row';

export interface ScoreEntryResponseDto {
  id: string;
  userId: string;
  levelId: string;
  score: number;
  stars: number;
  moves: number;
  timeSeconds: number;
  createdAt: string;
}

// Shape de lectura del ranking: score DTO + username (ISP — separado del DTO de
// escritura que devuelve POST /scores, que no tiene username).
export interface LeaderboardEntryResponseDto extends ScoreEntryResponseDto {
  username: string;
}

// Respuesta canónica de POST /scores: solo score/stars derivados server-side
// (ADR 0006) — el resto de campos del ScoreEntry se exponen vía leaderboard.
export interface SubmitScoreResponseDto {
  score: number;
  stars: number;
}

export class ScoreMapper {
  static toSubmitResponse(entry: ScoreEntry): SubmitScoreResponseDto {
    return { score: entry.score.value, stars: entry.stars.value };
  }

  static leaderboardRowToDto(row: LeaderboardRow): LeaderboardEntryResponseDto {
    return {
      id: row.id,
      userId: row.userId,
      username: row.username,
      levelId: row.levelId,
      score: row.score,
      stars: row.stars,
      moves: row.moves,
      timeSeconds: row.timeSeconds,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
