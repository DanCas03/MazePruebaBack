import { ICell } from './cell.entity';
import { Position } from '../value-objects/position.vo';
import { CellType } from '../value-objects/cell-type.vo';

export class EmptyCell extends ICell {
  constructor(position: Position) {
    super(position, CellType.EMPTY);
  }
  canBeTraversed(): boolean { return true; }
}
