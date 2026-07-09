import { LevelBuilder } from './level.builder';
import { ArrowPrimitives } from './arrow.factory';
import { LevelId } from '../value-objects/level-id.vo';
import { InvalidArrowException } from '../exceptions/invalid-arrow.exception';
import { InvalidDirectionException } from '../exceptions/invalid-direction.exception';
import { InvalidLevelException } from '../exceptions/invalid-level.exception';

describe('LevelBuilder', () => {
  // Fixture: nivel de ejemplo del wire contract (CONTEXT-MAP.md) — tablero 8x11.
  const COLS = 8;
  const ROWS = 11;

  const bentArrowA1: ArrowPrimitives = {
    id: 'a1',
    headDir: 'up',
    cells: [
      [10, 3],
      [9, 3],
      [9, 4],
    ],
  };

  const straightArrowA2: ArrowPrimitives = {
    id: 'a2',
    headDir: 'right',
    cells: [
      [2, 0],
      [2, 1],
    ],
  };

  describe('build', () => {
    it('should build a valid Level when dimensions, time limit and arrows are set from the wire contract example', () => {
      // Arrange
      const id = new LevelId('l-007');
      const sut = new LevelBuilder(id)
        .withDimensions(COLS, ROWS)
        .withTimeLimit(90)
        .addArrow(bentArrowA1)
        .addArrow(straightArrowA2);
      // Act
      const level = sut.build();
      // Assert
      expect(level.id.equals(id)).toBe(true);
      expect(level.cols).toBe(COLS);
      expect(level.rows).toBe(ROWS);
      expect(level.timeLimitSec).toBe(90);
      expect(level.arrows).toHaveLength(2);
      expect(level.arrows[0].id.value).toBe('a1');
      expect(level.arrows[0].headDir).toBe('up');
      expect(level.arrows[0].cells.map((c) => [c.row, c.col])).toEqual([
        [10, 3],
        [9, 3],
        [9, 4],
      ]);
      expect(level.arrows[1].id.value).toBe('a2');
      expect(level.arrows[1].headDir).toBe('right');
      expect(level.arrows[1].cells.map((c) => [c.row, c.col])).toEqual([
        [2, 0],
        [2, 1],
      ]);
    });

    it('should build a Level with undefined timeLimitSec when withTimeLimit is never called', () => {
      // Arrange
      const sut = new LevelBuilder(new LevelId('l-007'))
        .withDimensions(COLS, ROWS)
        .addArrow(bentArrowA1)
        .addArrow(straightArrowA2);
      // Act
      const level = sut.build();
      // Assert
      expect(level.timeLimitSec).toBeUndefined();
    });

    it('should build a Level with undefined timeLimitSec when withTimeLimit is called with undefined', () => {
      // Arrange
      const sut = new LevelBuilder(new LevelId('l-007'))
        .withDimensions(COLS, ROWS)
        .withTimeLimit(undefined)
        .addArrow(bentArrowA1)
        .addArrow(straightArrowA2);
      // Act
      const level = sut.build();
      // Assert
      expect(level.timeLimitSec).toBeUndefined();
    });

    it('should throw InvalidLevelException when dimensions are never set', () => {
      // Arrange
      const sut = new LevelBuilder(new LevelId('l-007')).addArrow(
        bentArrowA1,
      );
      // Act / Assert
      expect(() => sut.build()).toThrow(InvalidLevelException);
    });

    it('should throw InvalidLevelException when two arrows added via separate addArrow calls share a cell', () => {
      // Arrange
      const overlapping: ArrowPrimitives = {
        id: 'a3',
        headDir: 'up',
        cells: [
          [2, 1],
          [3, 1],
        ],
      };
      const sut = new LevelBuilder(new LevelId('l-007'))
        .withDimensions(COLS, ROWS)
        .addArrow(straightArrowA2)
        .addArrow(overlapping);
      // Act / Assert
      expect(() => sut.build()).toThrow(InvalidLevelException);
    });
  });

  describe('addArrow', () => {
    it('should throw InvalidArrowException when a cell is not an integer pair', () => {
      // Arrange
      const malformed: ArrowPrimitives = {
        id: 'a1',
        headDir: 'up',
        cells: [[10, 3], [9] as unknown as number[]],
      };
      const sut = new LevelBuilder(new LevelId('l-007')).withDimensions(
        COLS,
        ROWS,
      );
      // Act / Assert
      expect(() => sut.addArrow(malformed)).toThrow(InvalidArrowException);
    });

    it('should throw InvalidDirectionException when headDir is not a valid direction string', () => {
      // Arrange
      const badDirection: ArrowPrimitives = {
        id: 'a1',
        headDir: 'north',
        cells: [
          [10, 3],
          [9, 3],
        ],
      };
      const sut = new LevelBuilder(new LevelId('l-007')).withDimensions(
        COLS,
        ROWS,
      );
      // Act / Assert
      expect(() => sut.addArrow(badDirection)).toThrow(
        InvalidDirectionException,
      );
    });
  });
});
