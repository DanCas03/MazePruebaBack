import { ICell } from './cell.entity';
import { ArrowCell } from './arrow-cell.entity';
import { WallCell } from './wall-cell.entity';
import { EmptyCell } from './empty-cell.entity';
import { ExitCell } from './exit-cell.entity';
import { Position } from '../value-objects/position.vo';
import { CellType, CellTypeValue } from '../value-objects/cell-type.vo';
import { Direction, DirectionValue } from '../value-objects/direction.vo';
import { UnknownCellTypeException } from '../exceptions/unknown-cell-type.exception';

/**
 * Factory Method para crear celdas.
 *
 * OCP: el código cliente nunca instancia clases concretas (`new ArrowCell`...).
 * Pide a la fábrica una celda a partir de su [CellType]; añadir un nuevo tipo
 * implica una subclase nueva y un `case` nuevo, sin tocar a los consumidores.
 *
 * DDD: recibe Value Objects ya validados ([CellType], [Position], [Direction]),
 * nunca strings crudos.
 */
export class CellFactory {
  static create(type: CellType, position: Position, direction?: Direction): ICell {
    switch (type.value) {
      case CellTypeValue.ARROW:
        return new ArrowCell(
          position,
          direction ?? Direction.of(DirectionValue.UP),
        );
      case CellTypeValue.WALL:
        return new WallCell(position);
      case CellTypeValue.EMPTY:
        return new EmptyCell(position);
      case CellTypeValue.EXIT:
        return new ExitCell(position);
      default:
        // Defensa en profundidad: CellType ya garantiza un valor válido.
        throw new UnknownCellTypeException(type.value);
    }
  }
}
