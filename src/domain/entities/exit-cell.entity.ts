import { ICell } from './cell.entity';
import { Position } from '../value-objects/position.vo';
import { CellType, CellTypeValue } from '../value-objects/cell-type.vo';

/** Celda de salida/victoria. Transitable. */
export class ExitCell extends ICell {
  constructor(position: Position) {
    super(position, CellType.of(CellTypeValue.EXIT));
  }

  isPassable(): boolean {
    return true;
  }
}
