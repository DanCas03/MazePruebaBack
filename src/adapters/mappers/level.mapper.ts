import type { Level } from '../../domain/entities/level.entity';
import type { ArrowId } from '../../domain/value-objects/arrow-id.vo';
import { HexSpace } from '../../domain/space/hex-space';

export interface ArrowDto {
  id: string;
  // Dirección de deslizamiento en formato wire camelCase (ADR-0007, back#58):
  // el conjunto completo es de 8 — up/down/left/right + upLeft/upRight/
  // downLeft/downRight. Cada nivel restringe al subconjunto de su espacio; los
  // niveles rectangulares usan solo las 4 ortogonales (una diagonal en un
  // espacio rectangular se rechaza en construcción, InvalidLevelException).
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
  // Máscara de silueta (ADR 0004, back#53): región -> celdas de relleno
  // [row, col]. Solo presente en niveles temáticos con figura; passthrough
  // opaco, igual trato que palette.
  silhouette?: Record<string, number[][]>;
  // Descriptor de geometría (ADR-0007, back#59): presente solo en niveles
  // hexagonales; ausente ⇒ rectángulo cols×rows (retrocompatibilidad total).
  // cols/rows siguen siendo el bounding box en ambas geometrías.
  space?: { type: 'hex'; radius: number };
}

export interface LevelSummaryDto {
  levelId: string;
  // Sección del catálogo (ADR 0004): 'campaign' | 'themed' | 'hex'.
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
      // Passthrough opaco: mismo trato que palette (dato opaco, sin
      // interpretar). Ausente cuando el nivel no trae máscara de figura.
      ...(level.silhouette !== undefined
        ? {
            silhouette: { ...level.silhouette } as unknown as Record<
              string,
              number[][]
            >,
          }
        : {}),
      ...(level.space instanceof HexSpace
        ? { space: { type: 'hex' as const, radius: level.space.radius } }
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
