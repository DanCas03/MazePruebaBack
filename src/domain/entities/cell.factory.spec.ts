import { CellFactory } from './cell.factory';
import { ArrowCell } from './arrow-cell.entity';
import { WallCell } from './wall-cell.entity';
import { ICell } from './cell.entity';
import { Position } from '../value-objects/position.vo';
import { CellType } from '../value-objects/cell-type.vo';
import { Direction } from '../value-objects/direction.vo';
import { UnknownCellTypeException } from '../exceptions/unknown-cell-type.exception';

describe('CellFactory (Factory Method)', () => {
  it('crea una ArrowCell transitable a partir de Value Objects', () => {
    // Arrange
    const type = CellType.of('ARROW');
    const position = Position.of(0, 0);
    const direction = Direction.of('UP');

    // Act
    const cell: ICell = CellFactory.create(type, position, direction);

    // Assert
    expect(cell).toBeInstanceOf(ArrowCell);
    // LSP: se invoca por la abstracción ICell sin conocer el tipo concreto.
    expect(cell.isPassable()).toBe(true);
  });

  it('crea una WallCell NO transitable', () => {
    // Arrange
    const cell = CellFactory.create(CellType.of('WALL'), Position.of(1, 1));

    // Act / Assert
    expect(cell).toBeInstanceOf(WallCell);
    expect(cell.isPassable()).toBe(false);
  });

  it('un tipo desconocido falla al construir el CellType', () => {
    // Arrange / Act / Assert
    expect(() => CellType.of('PORTAL')).toThrow(UnknownCellTypeException);
  });
});
