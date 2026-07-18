import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Level } from '../../domain/entities/level.entity';
import type { ArrowId } from '../../domain/value-objects/arrow-id.vo';

export class ArrowDto {
  @ApiProperty({
    example: 'a1',
    description: 'Arrow id, unique within the level',
  })
  id!: string;
  // Dirección de deslizamiento en formato wire camelCase (ADR-0007, back#58):
  // el conjunto completo es de 8 — up/down/left/right + upLeft/upRight/
  // downLeft/downRight. Cada nivel restringe al subconjunto de su espacio; los
  // niveles rectangulares usan solo las 4 ortogonales (una diagonal en un
  // espacio rectangular se rechaza en construcción, InvalidLevelException).
  @ApiProperty({
    example: 'RIGHT',
    description: 'Direction the arrow slides when tapped',
  })
  headDir!: string;

  @ApiProperty({
    example: [
      [0, 0],
      [0, 1],
    ],
    description: 'Cells the arrow occupies, each as [row, col]',
    type: 'array',
    items: { type: 'array', items: { type: 'number' } },
  })
  cells!: number[][];
  // Rol de pintado (ADR 0004): solo en flechas de niveles temáticos con
  // Instrucciones de pintado; dato opaco para la mecánica.
  @ApiPropertyOptional({
    example: 'heart-fill',
    description:
      'Paint role (ADR 0004): only on arrows of themed levels with paint ' +
      'instructions; opaque data for the mechanic.',
  })
  paintRole?: string;
}

// Solución de un Level (back#19): el orden de ArrowId que vacía el tablero.
// `solution` son ids planos, la lengua compartida del cable (CONTEXT-MAP.md);
// ningún modelo de dominio cruza el HTTP.
export class SolutionResponseDto {
  @ApiProperty({ example: 'level-07' })
  levelId!: string;

  @ApiProperty({
    example: ['a3', 'a1', 'a2'],
    description: 'Arrow ids in clearing order',
    type: [String],
  })
  solution!: string[];
}

export class LevelResponseDto {
  @ApiProperty({ example: 'level-07' })
  levelId!: string;

  @ApiProperty({ example: 8 })
  cols!: number;

  @ApiProperty({ example: 8 })
  rows!: number;

  @ApiPropertyOptional({
    example: 60,
    description: 'Time limit in whole seconds, only present on timed levels',
  })
  timeLimitSec?: number;

  @ApiProperty({ type: [ArrowDto] })
  arrows!: ArrowDto[];

  @ApiPropertyOptional({
    description:
      'Color-role palette (ADR 0004): role -> hex #RRGGBB. Only present ' +
      'on themed levels; served as opaque passthrough data.',
    example: { 'heart-fill': '#E63946' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  palette?: Record<string, string>;

  @ApiPropertyOptional({
    description:
      'Figure silhouette mask (ADR 0004, back#53/#54): region -> fill ' +
      'cells [row, col]. Only present on themed levels with a figure ' +
      'mask; opaque passthrough, same treatment as palette.',
    example: {
      'heart-fill': [
        [2, 3],
        [2, 4],
      ],
    },
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { type: 'array', items: { type: 'number' } },
    },
  })
  silhouette?: Record<string, number[][]>;
}

export class LevelSummaryDto {
  @ApiProperty({ example: 'level-07' })
  levelId!: string;

  @ApiProperty({
    example: 'campaign',
    enum: ['campaign', 'themed'],
    description: 'Catalog section (ADR 0004)',
  })
  section!: string;
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
