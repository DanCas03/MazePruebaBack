import type { Level } from '../../domain/entities/level.entity';
import type { ArrowId } from '../../domain/value-objects/arrow-id.vo';

export interface ArrowDto {
  id: string;
  headDir: string;
  cells: number[][];
}

// Solución de un Level (back#19): el orden de ArrowId que vacía el tablero.
// `solution` son ids planos, la lengua compartida del cable (CONTEXT-MAP.md);
// ningún modelo de dominio cruza el HTTP.
export interface SolutionResponseDto {
  levelId: string;
  solution: string[];
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

  static toSolutionDto(
    levelId: string,
    solution: readonly ArrowId[],
  ): SolutionResponseDto {
    return {
      levelId,
      solution: solution.map((arrowId) => arrowId.value),
    };
  }
}
