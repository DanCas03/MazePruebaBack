import type { Level } from '../../domain/entities/level.entity';
import type { ArrowId } from '../../domain/value-objects/arrow-id.vo';

export interface ArrowDto {
  id: string;
  headDir: string;
  cells: number[][];
  // Rol de pintado (ADR 0004): solo en flechas de niveles temáticos con
  // Instrucciones de pintado; dato opaco para la mecánica.
  paintRole?: string;
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
  // Paleta de roles de color (ADR 0004): rol -> hex #RRGGBB. Solo presente
  // en niveles temáticos; el back la sirve como dato opaco (passthrough).
  palette?: Record<string, string>;
}

export interface LevelSummaryDto {
  levelId: string;
  // Sección del catálogo (ADR 0004): 'campaign' | 'themed'.
  section: string;
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
        // Passthrough opaco: el rol viene del portador paint del Level.
        ...(level.paint?.roles[arrow.id.value] !== undefined
          ? { paintRole: level.paint.roles[arrow.id.value] }
          : {}),
      })),
      ...(level.paint !== undefined
        ? { palette: { ...level.paint.palette } }
        : {}),
    };
  }

  static toSummaryDto(level: Level): LevelSummaryDto {
    return { levelId: level.id.value, section: level.section };
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
