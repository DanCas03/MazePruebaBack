// Factory Method: el llamador solicita una celda por tipo; la subclase concreta
// se decide aquí. Añadir un tipo nuevo → nueva subclase + nuevo case. No hay if/switch dispersos.
import { ICell } from './cell.entity';
import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { CellType } from '../value-objects/cell-type.vo';
import { ArrowCell } from './arrow-cell.entity';
import { EmptyCell } from './empty-cell.entity';
import { ExitCell } from './exit-cell.entity';
import { WallCell } from './wall-cell.entity';

export interface ArrowCellOptions {
  direction?: Direction;
  length?: number;
}

export class CellFactory {
  static create(type: CellType, position: Position, options?: ArrowCellOptions): ICell {
    switch (type) {
      case CellType.ARROW:
        if (!options?.direction || options?.length === undefined) {
          throw new Error('ArrowCell requires direction and length');
        }
        return new ArrowCell(position, options.direction, options.length);
      case CellType.EMPTY:
        return new EmptyCell(position);
      case CellType.EXIT:
        return new ExitCell(position);
      case CellType.WALL:
        return new WallCell(position);
    }
  }
}
