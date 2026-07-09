import type { ScoreEntry } from '../../domain/entities/score-entry.entity';

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

export class ScoreMapper {
  static toDto(entry: ScoreEntry): ScoreEntryResponseDto {
    return {
      id: entry.id.value,
      userId: entry.userId.value,
      levelId: entry.levelId.value,
      score: entry.score.value,
      stars: entry.stars.value,
      moves: entry.moves.value,
      timeSeconds: entry.time.seconds,
      createdAt: entry.createdAt.toISOString(),
    };
  }
}
