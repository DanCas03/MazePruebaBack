import type { ICell } from '../../domain/entities/cell.entity';
import { ArrowCell } from '../../domain/entities/arrow-cell.entity';
import { CellType } from '../../domain/value-objects/cell-type.vo';

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
      cells: grid.map((row) => row.map((cell) => LevelMapper.cellToDto(cell))),
    };
  }

  private static cellToDto(cell: ICell): CellDto {
    const base: CellDto = {
      type: cell.type,
      position: { row: cell.position.row, col: cell.position.col },
    };
    // OCP: discriminamos por el campo `type` del contrato ICell en lugar de
    // `instanceof`, evitando acoplar el mapper a la jerarquía de clases concreta.
    if (cell.type === CellType.ARROW) {
      const arrow = cell as ArrowCell;
      return { ...base, direction: arrow.direction, length: arrow.length };
    }
    return base;
  }
}
