import { Position } from '../value-objects/position.vo';
import { CellType } from '../value-objects/cell-type.vo';

export abstract class ICell {
  constructor(
    readonly position: Position,
    readonly type: CellType,
  ) {}

  abstract canBeTraversed(): boolean;
}
