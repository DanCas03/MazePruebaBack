import { ICell } from './cell.entity';
import { Position } from '../value-objects/position.vo';
import { CellType, CellTypeValue } from '../value-objects/cell-type.vo';

/** Celda bloqueante. LSP: `isPassable()` siempre `false`. */
export class WallCell extends ICell {
  constructor(position: Position) {
    super(position, CellType.of(CellTypeValue.WALL));
  }

  isPassable(): boolean {
    return false;
  }
}
