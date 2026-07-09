import type { Level } from '../../domain/entities/level.entity';

export interface ArrowDto {
  id: string;
  headDir: string;
  cells: number[][];
}

export interface LevelResponseDto {
  levelId: string;
  cols: number;
  rows: number;
  timeLimitSec?: number;
  arrows: ArrowDto[];
}

export interface LevelSummaryDto {
  levelId: string;
}

export class LevelMapper {
  static toDto(level: Level): LevelResponseDto {
    return {
      levelId: level.id.value,
      cols: level.cols,
      rows: level.rows,
      timeLimitSec: level.timeLimitSec,
      arrows: level.arrows.map((arrow) => ({
        id: arrow.id.value,
        headDir: arrow.headDir,
        cells: arrow.cells.map((cell) => [cell.row, cell.col]),
      })),
    };
  }

  static toSummaryDto(level: Level): LevelSummaryDto {
    return { levelId: level.id.value };
  }
}
