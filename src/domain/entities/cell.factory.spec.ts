import { CellFactory } from './cell.factory';
import { CellType } from '../value-objects/cell-type.vo';
import { Direction } from '../value-objects/direction.vo';
import { Position } from '../value-objects/position.vo';
import { ArrowCell } from './arrow-cell.entity';
import { EmptyCell } from './empty-cell.entity';
import { ExitCell } from './exit-cell.entity';
import { WallCell } from './wall-cell.entity';

describe('CellFactory', () => {
  const pos = new Position(0, 0);

  describe('create', () => {
    it('should return ArrowCell for ARROW type and mark it as non-traversable', () => {
      // Arrange / Act
      const cell = CellFactory.create(CellType.ARROW, pos, {
        direction: Direction.RIGHT,
        length: 2,
      });
      // Assert
      expect(cell).toBeInstanceOf(ArrowCell);
      expect(cell.canBeTraversed()).toBe(false);
    });

    it('should return EmptyCell for EMPTY type and mark it as traversable', () => {
      // Arrange / Act
      const cell = CellFactory.create(CellType.EMPTY, pos);
      // Assert
      expect(cell).toBeInstanceOf(EmptyCell);
      expect(cell.canBeTraversed()).toBe(true);
    });

    it('should return ExitCell for EXIT type and mark it as traversable', () => {
      const cell = CellFactory.create(CellType.EXIT, pos);
      expect(cell).toBeInstanceOf(ExitCell);
      expect(cell.canBeTraversed()).toBe(true);
    });

    it('should return WallCell for WALL type and mark it as non-traversable', () => {
      const cell = CellFactory.create(CellType.WALL, pos);
      expect(cell).toBeInstanceOf(WallCell);
      expect(cell.canBeTraversed()).toBe(false);
    });

    it('should throw when ARROW type is missing direction or length', () => {
      expect(() =>
        CellFactory.create(CellType.ARROW, pos, { length: 2 } as any),
      ).toThrow();
    });
  });
});
