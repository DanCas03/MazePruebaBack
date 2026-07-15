import { RectSpace } from './rect-space';
import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { InvalidBoardSpaceException } from '../exceptions/invalid-board-space.exception';

describe('RectSpace', () => {
  // Helper: construye la lista de posiciones a partir de pares (row, col).
  const positionsOf = (...coords: [number, number][]): Position[] =>
    coords.map(([row, col]) => new Position(row, col));

  // SUT por defecto: espacio 4 columnas x 3 filas (rows 0..2, cols 0..3).
  let sut: RectSpace;

  beforeEach(() => {
    sut = new RectSpace(4, 3);
  });

  describe('constructor', () => {
    it('should expose cols and rows when dimensions are valid positive integers', () => {
      // Arrange / Act — el SUT ya está construido en beforeEach
      // Assert
      expect(sut.cols).toBe(4);
      expect(sut.rows).toBe(3);
    });

    it('should throw InvalidBoardSpaceException when cols is 0', () => {
      // Act / Assert
      expect(() => new RectSpace(0, 3)).toThrow(InvalidBoardSpaceException);
    });

    it('should throw InvalidBoardSpaceException when rows is 0', () => {
      // Act / Assert
      expect(() => new RectSpace(4, 0)).toThrow(InvalidBoardSpaceException);
    });

    it('should throw InvalidBoardSpaceException when cols is negative', () => {
      // Act / Assert
      expect(() => new RectSpace(-1, 3)).toThrow(InvalidBoardSpaceException);
    });

    it('should throw InvalidBoardSpaceException when cols is not an integer', () => {
      // Act / Assert
      expect(() => new RectSpace(2.5, 3)).toThrow(InvalidBoardSpaceException);
    });

    it('should throw InvalidBoardSpaceException when rows is not an integer', () => {
      // Act / Assert
      expect(() => new RectSpace(4, 1.5)).toThrow(InvalidBoardSpaceException);
    });
  });

  describe('directions', () => {
    it('should return exactly the four orthogonal directions in canonical order', () => {
      // Act
      const result = sut.directions;
      // Assert
      expect(result).toEqual([
        Direction.UP,
        Direction.DOWN,
        Direction.LEFT,
        Direction.RIGHT,
      ]);
    });
  });

  describe('contains', () => {
    it('should return true when the position is an interior cell', () => {
      // Act / Assert
      expect(sut.contains(new Position(1, 1))).toBe(true);
    });

    it('should return true when the position is a corner cell', () => {
      // Act / Assert
      expect(sut.contains(new Position(0, 0))).toBe(true);
      expect(sut.contains(new Position(2, 3))).toBe(true);
    });

    it('should return false when row equals rows (first row outside)', () => {
      // Act / Assert
      expect(sut.contains(new Position(3, 0))).toBe(false);
    });

    it('should return false when col equals cols (first column outside)', () => {
      // Act / Assert
      expect(sut.contains(new Position(0, 4))).toBe(false);
    });
  });

  describe('step', () => {
    it('should return the orthogonal neighbor when stepping from an interior cell in each direction', () => {
      // Arrange
      const from = new Position(1, 1);
      // Act / Assert
      expect(sut.step(from, Direction.RIGHT)).toEqual(new Position(1, 2));
      expect(sut.step(from, Direction.LEFT)).toEqual(new Position(1, 0));
      expect(sut.step(from, Direction.UP)).toEqual(new Position(0, 1));
      expect(sut.step(from, Direction.DOWN)).toEqual(new Position(2, 1));
    });

    it('should return null when stepping out through each border edge', () => {
      // La frontera es un resultado normal (null), nunca una excepción.
      // Act / Assert
      expect(sut.step(new Position(0, 1), Direction.UP)).toBeNull();
      expect(sut.step(new Position(1, 0), Direction.LEFT)).toBeNull();
      expect(sut.step(new Position(2, 1), Direction.DOWN)).toBeNull();
      expect(sut.step(new Position(1, 3), Direction.RIGHT)).toBeNull();
    });

    it('should return null when the origin position lies outside the space', () => {
      // Desde fuera del espacio no se pisa, sin importar dónde caería la vecina.
      // Act / Assert
      expect(sut.step(new Position(5, 5), Direction.LEFT)).toBeNull();
    });
  });

  describe('areAdjacent', () => {
    it('should return true when cells are horizontal orthogonal neighbors in both orders', () => {
      // Act / Assert
      expect(sut.areAdjacent(new Position(1, 1), new Position(1, 2))).toBe(
        true,
      );
      expect(sut.areAdjacent(new Position(1, 2), new Position(1, 1))).toBe(
        true,
      );
    });

    it('should return true when cells are vertical orthogonal neighbors', () => {
      // Act / Assert
      expect(sut.areAdjacent(new Position(0, 1), new Position(1, 1))).toBe(
        true,
      );
    });

    it('should return false when cells are diagonal neighbors', () => {
      // Act / Assert
      expect(sut.areAdjacent(new Position(1, 1), new Position(2, 2))).toBe(
        false,
      );
    });

    it('should return false when both positions are the same cell', () => {
      // Act / Assert
      expect(sut.areAdjacent(new Position(1, 1), new Position(1, 1))).toBe(
        false,
      );
    });

    it('should return false when cells are distant on the same row', () => {
      // Act / Assert
      expect(sut.areAdjacent(new Position(0, 0), new Position(0, 2))).toBe(
        false,
      );
    });

    it('should return false when the second position lies outside the space', () => {
      // (2,4) es construible (no-negativa) pero cae fuera del espacio 4x3:
      // step((2,3), RIGHT) devuelve null, así que no hay adyacencia posible.
      // Act / Assert
      expect(sut.areAdjacent(new Position(2, 3), new Position(2, 4))).toBe(
        false,
      );
    });
  });

  describe('exitLane', () => {
    it('should return the cells from head to border excluding the head when exiting RIGHT', () => {
      // Act
      const lane = sut.exitLane(new Position(1, 0), Direction.RIGHT);
      // Assert — orden cercano→frontera, la cabeza se EXCLUYE.
      expect(lane).toEqual(positionsOf([1, 1], [1, 2], [1, 3]));
    });

    it('should return the cells from head to border excluding the head when exiting LEFT', () => {
      // Act
      const lane = sut.exitLane(new Position(1, 3), Direction.LEFT);
      // Assert
      expect(lane).toEqual(positionsOf([1, 2], [1, 1], [1, 0]));
    });

    it('should return the cells from head to border excluding the head when exiting UP', () => {
      // Act
      const lane = sut.exitLane(new Position(2, 1), Direction.UP);
      // Assert
      expect(lane).toEqual(positionsOf([1, 1], [0, 1]));
    });

    it('should return the cells from head to border excluding the head when exiting DOWN', () => {
      // Act
      const lane = sut.exitLane(new Position(0, 1), Direction.DOWN);
      // Assert
      expect(lane).toEqual(positionsOf([1, 1], [2, 1]));
    });

    it('should return an empty lane when the head already touches the border', () => {
      // Act / Assert
      expect(sut.exitLane(new Position(1, 3), Direction.RIGHT)).toEqual([]);
      expect(sut.exitLane(new Position(0, 0), Direction.UP)).toEqual([]);
    });
  });

  describe('allCells / cellCount', () => {
    it('should enumerate every cell in row-major order when iterating allCells', () => {
      // Arrange
      const space = new RectSpace(3, 2);
      // Act
      const cells = Array.from(space.allCells());
      // Assert
      expect(cells).toEqual(
        positionsOf([0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]),
      );
    });

    it('should return the total number of cells when reading cellCount', () => {
      // Act / Assert
      expect(sut.cellCount).toBe(12);
      expect(new RectSpace(1, 1).cellCount).toBe(1);
    });
  });
});
