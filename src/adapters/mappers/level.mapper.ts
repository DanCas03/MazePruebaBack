import type { ICell } from '../../domain/entities/cell.entity';
import { ArrowCell } from '../../domain/entities/arrow-cell.entity';

export interface CellDto {
  type: string;
  position: { row: number; col: number };
  direction?: string;
  length?: number;
}

export interface LevelResponseDto {
  cells: CellDto[][];
}

export class LevelMapper {
  static toDto(grid: ICell[][]): LevelResponseDto {
    return {
      cells: grid.map((row) =>
        row.map((cell) => ({
          type: cell.type,
          position: { row: cell.position.row, col: cell.position.col },
          ...(cell instanceof ArrowCell
            ? { direction: cell.direction, length: cell.length }
            : {}),
        })),
      ),
    };
  }
}
