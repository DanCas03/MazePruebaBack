import { ICell } from './cell.entity';
import { Position } from '../value-objects/position.vo';
import { CellType } from '../value-objects/cell-type.vo';

export class ExitCell extends ICell {
  constructor(position: Position) {
    super(position, CellType.EXIT);
  }
  canBeTraversed(): boolean { return true; }
}
