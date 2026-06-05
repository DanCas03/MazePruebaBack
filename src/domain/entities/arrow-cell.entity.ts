import { ICell } from './cell.entity';
import { Position } from '../value-objects/position.vo';
import { CellType, CellTypeValue } from '../value-objects/cell-type.vo';
import { Direction } from '../value-objects/direction.vo';

/**
 * Celda con una flecha orientable. LSP: `isPassable()` siempre `true`.
 */
export class ArrowCell extends ICell {
  constructor(
    position: Position,
    public readonly direction: Direction,
  ) {
    super(position, CellType.of(CellTypeValue.ARROW));
  }

  isPassable(): boolean {
    return true;
  }

  /**
   * Devuelve una NUEVA celda con la flecha rotada (inmutabilidad DDD). La regla
   * de rotación vive en el Value Object [Direction].
   */
  rotate(): ArrowCell {
    return new ArrowCell(this.position, this.direction.rotateClockwise());
  }
}
