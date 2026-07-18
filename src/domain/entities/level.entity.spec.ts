import { Level } from './level.entity';
import { Arrow } from './arrow.entity';
import { LevelId } from '../value-objects/level-id.vo';
import { ArrowId } from '../value-objects/arrow-id.vo';
import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { RectSpace } from '../space/rect-space';
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
    it('should create a level and expose id, space, cols, rows, arrows and timeLimitSec when two arrows fit inside the board', () => {
      // Arrange
      const id = new LevelId('level-001');
      const space = new RectSpace(COLS, ROWS);
      const a1 = bentArrowA1();
      const a2 = straightArrowA2();
      // Act
      const sut = new Level(id, space, [a1, a2], 90);
      // Assert
      expect(sut.id.equals(id)).toBe(true);
      // ADR 0005: el agregado sostiene el espacio y lo expone tal cual.
      expect(sut.space).toBe(space);
      // cols/rows ahora derivan del bounding box del espacio: mismo valor.
      expect(sut.cols).toBe(COLS);
      expect(sut.rows).toBe(ROWS);
      expect(sut.arrows).toHaveLength(2);
      expect(sut.arrows[0].equals(a1)).toBe(true);
      expect(sut.arrows[1].equals(a2)).toBe(true);
      expect(sut.timeLimitSec).toBe(90);
    });

    it('should throw InvalidLevelException when timeLimitSec is omitted (undefined) — mandatory since ADR 0006', () => {
      // Arrange
      const arrows = [bentArrowA1(), straightArrowA2()];
      // Act / Assert
      expect(
        () =>
          new Level(
            new LevelId('level-001'),
            new RectSpace(COLS, ROWS),
            arrows,
            undefined as unknown as number,
          ),
      ).toThrow(InvalidLevelException);
    });

    it('should create a level when timeLimitSec is 1 — minimum positive integer', () => {
      // Arrange
      const arrows = [bentArrowA1(), straightArrowA2()];
      // Act
      const sut = new Level(
        new LevelId('level-001'),
        new RectSpace(COLS, ROWS),
        arrows,
        1,
      );
      // Assert
      expect(sut.timeLimitSec).toBe(1);
    });

    it('should default section to campaign and leave paint undefined when omitted (retro-compat, ADR 0004)', () => {
      // Arrange
      const arrows = [bentArrowA1(), straightArrowA2()];
      // Act
      const sut = new Level(
        new LevelId('level-001'),
        new RectSpace(COLS, ROWS),
        arrows,
        90,
      );
      // Assert
      expect(sut.section).toBe('campaign');
      expect(sut.paint).toBeUndefined();
    });

    it('should carry section and paint as opaque data without validating their content', () => {
      // Arrange — paint deliberadamente arbitrario: el dominio no lo interpreta.
      const arrows = [bentArrowA1(), straightArrowA2()];
      const paint = {
        palette: { cara: '#FBBF24', ojo: '#1E293B' },
        roles: { a1: 'cara', a2: 'ojo' },
      };
      // Act
      const sut = new Level(
        new LevelId('t-smoke'),
        new RectSpace(COLS, ROWS),
        arrows,
        90,
        'themed',
        paint,
      );
      // Assert
      expect(sut.section).toBe('themed');
      expect(sut.paint).toEqual(paint);
    });

    it('should carry silhouette as opaque data without validating its content, leaving it undefined when omitted (task 8)', () => {
      // Arrange — silhouette deliberadamente arbitrario: el dominio no lo interpreta.
      const arrows = [bentArrowA1(), straightArrowA2()];
      const silhouette = {
        heart: [
          [0, 0],
          [0, 1],
        ] as [number, number][],
      };
      // Act
      const withSilhouette = new Level(
        new LevelId('t-smoke'),
        new RectSpace(COLS, ROWS),
        arrows,
        90,
        'themed',
        undefined,
        silhouette,
      );
      const withoutSilhouette = new Level(
        new LevelId('level-001'),
        new RectSpace(COLS, ROWS),
        arrows,
        90,
      );
      // Assert
      expect(withSilhouette.silhouette).toEqual(silhouette);
      expect(withoutSilhouette.silhouette).toBeUndefined();
    });

    it('should create a degenerate level when arrows is empty — the brief does not forbid it', () => {
      // Arrange
      const arrows: Arrow[] = [];
      // Act
      const sut = new Level(
        new LevelId('level-001'),
        new RectSpace(COLS, ROWS),
        arrows,
        90,
      );
      // Assert
      expect(sut.arrows).toHaveLength(0);
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
        () =>
          new Level(
            new LevelId('level-001'),
            new RectSpace(COLS, ROWS),
            [outOfBounds],
            90,
          ),
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
        () =>
          new Level(
            new LevelId('level-001'),
            new RectSpace(COLS, ROWS),
            [outOfBounds],
            90,
          ),
      ).toThrow(InvalidLevelException);
    });

    // Tests mudados desde Arrow (ADR 0005): la adyacencia del camino es
    // geometría del espacio, no invariante del dato — ahora la valida Level
    // vía BoardSpace.areAdjacent y lanza InvalidLevelException.
    it('should throw InvalidLevelException when consecutive cells of an arrow are separated by a gap', () => {
      // Arrange
      const gapped = new Arrow(
        new ArrowId('a1'),
        cellsOf([0, 0], [0, 2]),
        Direction.UP,
      );
      // Act / Assert
      expect(
        () =>
          new Level(
            new LevelId('level-001'),
            new RectSpace(COLS, ROWS),
            [gapped],
            90,
          ),
      ).toThrow(InvalidLevelException);
    });

    it('should throw InvalidLevelException when an arrow headDir is not a direction of the space (diagonal in a RectSpace)', () => {
      // Arrange — RectSpace solo publica las 4 ortogonales; una flecha diagonal
      // no cabe en su espacio (ADR-0007, back#58).
      const diagonal = new Arrow(
        new ArrowId('a1'),
        cellsOf([0, 0], [0, 1]),
        Direction.UP_LEFT,
      );
      // Act / Assert
      expect(
        () =>
          new Level(
            new LevelId('level-001'),
            new RectSpace(COLS, ROWS),
            [diagonal],
            90,
          ),
      ).toThrow(InvalidLevelException);
    });

    it('should throw InvalidLevelException when consecutive cells of an arrow are diagonally adjacent', () => {
      // Arrange
      const diagonal = new Arrow(
        new ArrowId('a1'),
        cellsOf([0, 0], [1, 1]),
        Direction.UP,
      );
      // Act / Assert
      expect(
        () =>
          new Level(
            new LevelId('level-001'),
            new RectSpace(COLS, ROWS),
            [diagonal],
            90,
          ),
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
        () =>
          new Level(
            new LevelId('level-001'),
            new RectSpace(COLS, ROWS),
            [a1, a2],
            90,
          ),
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
          new Level(
            new LevelId('level-001'),
            new RectSpace(COLS, ROWS),
            [first, duplicate],
            90,
          ),
      ).toThrow(InvalidLevelException);
    });

    it('should throw InvalidLevelException when timeLimitSec is 0', () => {
      // Arrange
      const arrows = [bentArrowA1(), straightArrowA2()];
      // Act / Assert
      expect(
        () =>
          new Level(
            new LevelId('level-001'),
            new RectSpace(COLS, ROWS),
            arrows,
            0,
          ),
      ).toThrow(InvalidLevelException);
    });

    it('should throw InvalidLevelException when timeLimitSec is negative', () => {
      // Arrange
      const arrows = [bentArrowA1(), straightArrowA2()];
      // Act / Assert
      expect(
        () =>
          new Level(
            new LevelId('level-001'),
            new RectSpace(COLS, ROWS),
            arrows,
            -30,
          ),
      ).toThrow(InvalidLevelException);
    });

    it('should throw InvalidLevelException when timeLimitSec is not an integer', () => {
      // Arrange
      const arrows = [bentArrowA1(), straightArrowA2()];
      // Act / Assert
      expect(
        () =>
          new Level(
            new LevelId('level-001'),
            new RectSpace(COLS, ROWS),
            arrows,
            1.5,
          ),
      ).toThrow(InvalidLevelException);
    });
  });
});
