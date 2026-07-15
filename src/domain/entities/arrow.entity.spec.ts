import { Arrow } from './arrow.entity';
import { ArrowId } from '../value-objects/arrow-id.vo';
import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { InvalidArrowException } from '../exceptions/invalid-arrow.exception';

describe('Arrow', () => {
  // Helper: construye la lista de celdas a partir de pares (row, col).
  const cellsOf = (...coords: [number, number][]): Position[] =>
    coords.map(([row, col]) => new Position(row, col));

  describe('constructor', () => {
    it('should create a straight arrow and expose id, cells and headDir when the path is a valid horizontal segment', () => {
      // Arrange
      const id = new ArrowId('a1');
      const cells = cellsOf([2, 0], [2, 1]);
      // Act
      const sut = new Arrow(id, cells, Direction.RIGHT);
      // Assert
      expect(sut.id.equals(id)).toBe(true);
      expect(sut.cells).toEqual(cellsOf([2, 0], [2, 1]));
      expect(sut.headDir).toBe(Direction.RIGHT);
    });

    it('should create a bent arrow when cells form an L-shaped orthogonal path', () => {
      // Arrange
      const cells = cellsOf([10, 3], [9, 3], [9, 4]);
      // Act
      const sut = new Arrow(new ArrowId('a1'), cells, Direction.RIGHT);
      // Assert
      expect(sut.cells).toEqual(cellsOf([10, 3], [9, 3], [9, 4]));
    });

    it('should create a single-cell arrow when cells contain exactly one position', () => {
      // Arrange
      const cells = cellsOf([0, 0]);
      // Act
      const sut = new Arrow(new ArrowId('a1'), cells, Direction.UP);
      // Assert
      expect(sut.cells).toEqual(cellsOf([0, 0]));
    });

    it('should throw InvalidArrowException when cells is empty', () => {
      expect(() => new Arrow(new ArrowId('a1'), [], Direction.UP)).toThrow(
        InvalidArrowException,
      );
    });

    it('should throw InvalidArrowException when a cell is repeated in the path', () => {
      // Arrange
      const cells = cellsOf([0, 0], [0, 1], [0, 0]);
      // Act / Assert
      expect(() => new Arrow(new ArrowId('a1'), cells, Direction.UP)).toThrow(
        InvalidArrowException,
      );
    });

    it('should create an arrow when consecutive cells are not adjacent — Arrow is pure data (ADR 0005)', () => {
      // La adyacencia del camino ya NO es invariante de Arrow: la geometría
      // del camino la valida Level vía BoardSpace.areAdjacent (ADR 0005).
      // Arrow es dato puro y acepta las celdas tal cual.
      // Arrange
      const cells = cellsOf([0, 0], [0, 2]);
      // Act
      const sut = new Arrow(new ArrowId('a1'), cells, Direction.UP);
      // Assert
      expect(sut.cells).toEqual(cellsOf([0, 0], [0, 2]));
    });

    it('should not throw when headDir does not match the path geometry', () => {
      // headDir es la dirección de salida de la cabeza y NO se valida contra el
      // camino: este test protege esa decisión de diseño (cualquier Direction
      // es aceptable para una flecha doblada).
      // Arrange
      const cells = cellsOf([10, 3], [9, 3], [9, 4]);
      // Act / Assert
      expect(
        () => new Arrow(new ArrowId('a1'), cells, Direction.DOWN),
      ).not.toThrow();
    });
  });

  describe('equals', () => {
    it('should return true when id, cells and headDir hold the same values across distinct instances', () => {
      // Arrange
      const a = new Arrow(
        new ArrowId('a1'),
        cellsOf([2, 0], [2, 1]),
        Direction.RIGHT,
      );
      const b = new Arrow(
        new ArrowId('a1'),
        cellsOf([2, 0], [2, 1]),
        Direction.RIGHT,
      );
      // Act / Assert
      expect(a.equals(b)).toBe(true);
    });

    it('should return false when only the id differs', () => {
      // Arrange
      const a = new Arrow(
        new ArrowId('a1'),
        cellsOf([2, 0], [2, 1]),
        Direction.RIGHT,
      );
      const b = new Arrow(
        new ArrowId('a2'),
        cellsOf([2, 0], [2, 1]),
        Direction.RIGHT,
      );
      // Act / Assert
      expect(a.equals(b)).toBe(false);
    });

    it('should return false when only headDir differs', () => {
      // Arrange
      const a = new Arrow(
        new ArrowId('a1'),
        cellsOf([2, 0], [2, 1]),
        Direction.RIGHT,
      );
      const b = new Arrow(
        new ArrowId('a1'),
        cellsOf([2, 0], [2, 1]),
        Direction.LEFT,
      );
      // Act / Assert
      expect(a.equals(b)).toBe(false);
    });

    it('should return false when cells hold the same positions in a different order', () => {
      // Arrange
      const a = new Arrow(
        new ArrowId('a1'),
        cellsOf([2, 1], [2, 0]),
        Direction.RIGHT,
      );
      const b = new Arrow(
        new ArrowId('a1'),
        cellsOf([2, 0], [2, 1]),
        Direction.RIGHT,
      );
      // Act / Assert
      expect(a.equals(b)).toBe(false);
    });

    it('should return false when cells differ in length', () => {
      // Arrange
      const a = new Arrow(
        new ArrowId('a1'),
        cellsOf([2, 0], [2, 1]),
        Direction.RIGHT,
      );
      const b = new Arrow(new ArrowId('a1'), cellsOf([2, 0]), Direction.RIGHT);
      // Act / Assert
      expect(a.equals(b)).toBe(false);
    });
  });
});
