import type { ProgressEntry } from '../../domain/entities/progress-entry.entity';

export interface ProgressEntryResponseDto {
  levelId: string;
  completed: boolean;
  bestScore: number | null;
  bestStars: number | null;
}

export class ProgressMapper {
  static toDto(entry: ProgressEntry): ProgressEntryResponseDto {
    return {
      levelId: entry.levelId.value,
      completed: entry.completed,
      bestScore: entry.bestScore?.value ?? null,
      bestStars: entry.bestStars?.value ?? null,
    };
  }
}
