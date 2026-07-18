import { ApiProperty } from '@nestjs/swagger';
import type { ProgressEntry } from '../../domain/entities/progress-entry.entity';

export class ProgressEntryResponseDto {
  @ApiProperty({ example: 'level-07' })
  levelId!: string;

  @ApiProperty({ example: true })
  completed!: boolean;

  @ApiProperty({
    example: 5240,
    nullable: true,
    description: 'Best score achieved on this level, or null if none yet',
  })
  bestScore!: number | null;

  @ApiProperty({
    example: 3,
    nullable: true,
    description: 'Best stars achieved on this level, or null if none yet',
  })
  bestStars!: number | null;
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
