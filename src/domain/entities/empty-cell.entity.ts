import { ICell } from './cell.entity';
import { Position } from '../value-objects/position.vo';
import { CellType, CellTypeValue } from '../value-objects/cell-type.vo';

/** Celda transitable sin efecto. */
export class EmptyCell extends ICell {
  constructor(position: Position) {
    super(position, CellType.of(CellTypeValue.EMPTY));
  }

  isPassable(): boolean {
    return true;
  }
}
