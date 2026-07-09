import { Level } from './level.entity';
import { Arrow } from './arrow.entity';
import { LevelId } from '../value-objects/level-id.vo';
import { ArrowId } from '../value-objects/arrow-id.vo';
import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { InvalidLevelException } from '../exceptions/invalid-level.exception';

describe('Level', () => {
  // Helper: construye la lista de celdas a partir de pares (row, col).
  const cellsOf = (...coords: [number, number][]): Position[] =>
    coords.map(([row, col]) => new Position(row, col));

  // Fixture: nivel de ejemplo del wire contract (CONTEXT-MAP.md) — tablero 8x11.
  const COLS = 8;
  const ROWS = 11;

  const bentArrowA1 = (): Arrow =>
    new Arrow(
      new ArrowId('a1'),
      cellsOf([10, 3], [9, 3], [9, 4]),
      Direction.UP,
    );

  const straightArrowA2 = (): Arrow =>
    new Arrow(new ArrowId('a2'), cellsOf([2, 0], [2, 1]), Direction.RIGHT);

  describe('constructor', () => {
    it('should create a level and expose id, cols, rows, arrows and timeLimitSec when two arrows fit inside the board', () => {
      // Arrange
      const id = new LevelId('level-001');
      const a1 = bentArrowA1();
      const a2 = straightArrowA2();
      // Act
      const sut = new Level(id, COLS, ROWS, [a1, a2], 90);
      // Assert
      expect(sut.id.equals(id)).toBe(true);
      expect(sut.cols).toBe(COLS);
      expect(sut.rows).toBe(ROWS);
      expect(sut.arrows).toHaveLength(2);
      expect(sut.arrows[0].equals(a1)).toBe(true);
      expect(sut.arrows[1].equals(a2)).toBe(true);
      expect(sut.timeLimitSec).toBe(90);
    });

    it('should create a level with undefined timeLimitSec when the time limit is omitted', () => {
      // Arrange
      const arrows = [bentArrowA1(), straightArrowA2()];
      // Act
      const sut = new Level(new LevelId('level-001'), COLS, ROWS, arrows);
      // Assert
      expect(sut.timeLimitSec).toBeUndefined();
    });

    it('should create a level when timeLimitSec is 1 — minimum positive integer', () => {
      // Arrange
      const arrows = [bentArrowA1(), straightArrowA2()];
      // Act
      const sut = new Level(new LevelId('level-001'), COLS, ROWS, arrows, 1);
      // Assert
      expect(sut.timeLimitSec).toBe(1);
    });

    it('should create a degenerate level when arrows is empty — the brief does not forbid it', () => {
      // Arrange
      const arrows: Arrow[] = [];
      // Act
      const sut = new Level(new LevelId('level-001'), COLS, ROWS, arrows, 90);
      // Assert
      expect(sut.arrows).toHaveLength(0);
    });

    it('should throw InvalidLevelException when cols is 0', () => {
      // Arrange / Act / Assert
      expect(() => new Level(new LevelId('level-001'), 0, ROWS, [])).toThrow(
        InvalidLevelException,
      );
    });

    it('should throw InvalidLevelException when rows is 0', () => {
      // Arrange / Act / Assert
      expect(() => new Level(new LevelId('level-001'), COLS, 0, [])).toThrow(
        InvalidLevelException,
      );
    });

    it('should throw InvalidLevelException when cols is not an integer', () => {
      // Arrange / Act / Assert
      expect(() => new Level(new LevelId('level-001'), 2.5, ROWS, [])).toThrow(
        InvalidLevelException,
      );
    });

    it('should throw InvalidLevelException when an arrow cell has row equal to rows — off the bottom edge', () => {
      // Arrange
      const outOfBounds = new Arrow(
        new ArrowId('a1'),
        cellsOf([10, 0], [11, 0]),
        Direction.DOWN,
      );
      // Act / Assert
      expect(
        () => new Level(new LevelId('level-001'), COLS, ROWS, [outOfBounds]),
      ).toThrow(InvalidLevelException);
    });

    it('should throw InvalidLevelException when an arrow cell has col equal to cols — off the right edge', () => {
      // Arrange
      const outOfBounds = new Arrow(
        new ArrowId('a1'),
        cellsOf([0, 7], [0, 8]),
        Direction.RIGHT,
      );
      // Act / Assert
      expect(
        () => new Level(new LevelId('level-001'), COLS, ROWS, [outOfBounds]),
      ).toThrow(InvalidLevelException);
    });

    it('should throw InvalidLevelException when two arrows share a cell', () => {
      // Arrange
      const a1 = new Arrow(
        new ArrowId('a1'),
        cellsOf([0, 0], [0, 1]),
        Direction.RIGHT,
      );
      const a2 = new Arrow(
        new ArrowId('a2'),
        cellsOf([1, 1], [0, 1]),
        Direction.UP,
      );
      // Act / Assert
      expect(
        () => new Level(new LevelId('level-001'), COLS, ROWS, [a1, a2]),
      ).toThrow(InvalidLevelException);
    });

    it('should throw InvalidLevelException when two arrows have the same id even with disjoint cells', () => {
      // Arrange
      const first = new Arrow(
        new ArrowId('a1'),
        cellsOf([0, 0], [0, 1]),
        Direction.RIGHT,
      );
      const duplicate = new Arrow(
        new ArrowId('a1'),
        cellsOf([5, 0], [5, 1]),
        Direction.RIGHT,
      );
      // Act / Assert
      expect(
        () =>
          new Level(new LevelId('level-001'), COLS, ROWS, [first, duplicate]),
      ).toThrow(InvalidLevelException);
    });

    it('should throw InvalidLevelException when timeLimitSec is 0', () => {
      // Arrange
      const arrows = [bentArrowA1(), straightArrowA2()];
      // Act / Assert
      expect(
        () => new Level(new LevelId('level-001'), COLS, ROWS, arrows, 0),
      ).toThrow(InvalidLevelException);
    });

    it('should throw InvalidLevelException when timeLimitSec is negative', () => {
      // Arrange
      const arrows = [bentArrowA1(), straightArrowA2()];
      // Act / Assert
      expect(
        () => new Level(new LevelId('level-001'), COLS, ROWS, arrows, -30),
      ).toThrow(InvalidLevelException);
    });

    it('should throw InvalidLevelException when timeLimitSec is not an integer', () => {
      // Arrange
      const arrows = [bentArrowA1(), straightArrowA2()];
      // Act / Assert
      expect(
        () => new Level(new LevelId('level-001'), COLS, ROWS, arrows, 1.5),
      ).toThrow(InvalidLevelException);
    });
  });
});
