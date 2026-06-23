import { ICell } from './cell.entity';
import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { CellType } from '../value-objects/cell-type.vo';

export class ArrowCell extends ICell {
  constructor(
    position: Position,
    readonly direction: Direction,
    readonly length: number,
  ) {
    super(position, CellType.ARROW);
    if (length < 1) throw new Error('ArrowCell length must be >= 1');
  }

  canBeTraversed(): boolean {
    return false;
  }
}
