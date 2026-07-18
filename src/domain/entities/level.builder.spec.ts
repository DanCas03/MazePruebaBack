import { LevelBuilder, SpaceDescriptor } from './level.builder';
import { ArrowPrimitives } from './arrow.factory';
import { LevelId } from '../value-objects/level-id.vo';
import { InvalidArrowException } from '../exceptions/invalid-arrow.exception';
import { InvalidDirectionException } from '../exceptions/invalid-direction.exception';
import { InvalidLevelException } from '../exceptions/invalid-level.exception';
import { InvalidBoardSpaceException } from '../exceptions/invalid-board-space.exception';
import { RectSpace } from '../space/rect-space';
import { HexSpace } from '../space/hex-space';
import { HexMaskedSpace } from '../space/hex-masked-space';
import { Position } from '../value-objects/position.vo';

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
      // ADR 0005: el builder es el wire que construye el espacio de
      // producción — un RectSpace concreto desde cols/rows del JSON.
      expect(level.space).toBeInstanceOf(RectSpace);
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

    it('should build a Level with the provisional timeLimitSec (max(30, arrows*6)) when withTimeLimit is never called (ADR 0006)', () => {
      // Arrange — 2 flechas ⇒ provisional = max(30, 2*6) = 30.
      const sut = new LevelBuilder(new LevelId('l-007'))
        .withDimensions(COLS, ROWS)
        .addArrow(bentArrowA1)
        .addArrow(straightArrowA2);
      // Act
      const level = sut.build();
      // Assert
      expect(level.timeLimitSec).toBe(30);
    });

    it('should build a Level with the provisional timeLimitSec when withTimeLimit is called with undefined (ADR 0006)', () => {
      // Arrange — 2 flechas ⇒ provisional = max(30, 2*6) = 30.
      const sut = new LevelBuilder(new LevelId('l-007'))
        .withDimensions(COLS, ROWS)
        .withTimeLimit(undefined)
        .addArrow(bentArrowA1)
        .addArrow(straightArrowA2);
      // Act
      const level = sut.build();
      // Assert
      expect(level.timeLimitSec).toBe(30);
    });

    it('should throw InvalidBoardSpaceException when dimensions are never set', () => {
      // ADR 0005: la invariante de dimensiones vive en RectSpace, así que el
      // builder sin withDimensions lanza la excepción del espacio (antes era
      // InvalidLevelException, cuando Level validaba cols/rows).
      // Arrange
      const sut = new LevelBuilder(new LevelId('l-007')).addArrow(bentArrowA1);
      // Act / Assert
      expect(() => sut.build()).toThrow(InvalidBoardSpaceException);
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
        cells: [[10, 3], [9]],
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

  // ADR 0004 (back#31): sección + Instrucciones de pintado como datos opacos.
  describe('withSection / withPaint', () => {
    const minimalBuilder = () =>
      new LevelBuilder(new LevelId('t-smoke'))
        .withDimensions(COLS, ROWS)
        .addArrow(bentArrowA1);

    it('should default section to campaign and leave paint undefined when neither is set', () => {
      // Arrange
      const sut = minimalBuilder();
      // Act
      const level = sut.build();
      // Assert
      expect(level.section).toBe('campaign');
      expect(level.paint).toBeUndefined();
    });

    it('should build a themed Level carrying the paint metadata untouched', () => {
      // Arrange
      const paint = {
        palette: { cara: '#FBBF24', ojo: '#1E293B' },
        roles: { a1: 'cara' },
      };
      const sut = minimalBuilder().withSection('themed').withPaint(paint);
      // Act
      const level = sut.build();
      // Assert
      expect(level.section).toBe('themed');
      expect(level.paint).toEqual(paint);
    });

    it('should fall back to campaign when section is absent or unknown (retro-compat)', () => {
      // Arrange
      const withUndefined = minimalBuilder().withSection(undefined);
      const withUnknown = minimalBuilder().withSection('bonus');
      // Act
      const levelFromUndefined = withUndefined.build();
      const levelFromUnknown = withUnknown.build();
      // Assert
      expect(levelFromUndefined.section).toBe('campaign');
      expect(levelFromUnknown.section).toBe('campaign');
    });
  });

  // Task 8: silhouette como dato opaco (espejo de withPaint) — la forma de
  // la figura se valida en el seed, no aquí.
  describe('withSilhouette', () => {
    const minimalBuilder = () =>
      new LevelBuilder(new LevelId('t-smoke'))
        .withDimensions(COLS, ROWS)
        .addArrow(bentArrowA1);

    it('should leave silhouette undefined when never set', () => {
      // Arrange
      const sut = minimalBuilder();
      // Act
      const level = sut.build();
      // Assert
      expect(level.silhouette).toBeUndefined();
    });

    it('should build a Level carrying the silhouette metadata untouched', () => {
      // Arrange
      const silhouette = {
        heart: [
          [0, 0],
          [0, 1],
        ] as [number, number][],
      };
      const sut = minimalBuilder().withSilhouette(silhouette);
      // Act
      const level = sut.build();
      // Assert
      expect(level.silhouette).toEqual(silhouette);
    });
  });

  // back#59: descriptor de espacio del wire — el builder es el único punto
  // que traduce {type:'hex', radius} a espacios concretos.
  describe('withSpace (back#59)', () => {
    it('should build a rectangular level when the descriptor is absent', () => {
      // Arrange / Act
      const level = new LevelBuilder(new LevelId('l-rect'))
        .withDimensions(3, 2)
        .addArrow({ id: 'a-0', headDir: 'right', cells: [[0, 0], [0, 1]] })
        .build();
      // Assert — bounding box del rect intacto.
      expect(level.cols).toBe(3);
      expect(level.rows).toBe(2);
      expect(level.space).toBeInstanceOf(RectSpace);
    });

    it('should build a HexSpace level ignoring wire cols/rows', () => {
      // Arrange / Act — cols/rows del wire contradicen al hex a propósito.
      const level = new LevelBuilder(new LevelId('l-hex'))
        .withDimensions(99, 99)
        .withSpace({ type: 'hex', radius: 2 })
        .addArrow({ id: 'a-0', headDir: 'up', cells: [[2, 2], [3, 2]] })
        .build();
      // Assert — bounding box derivado del espacio: (2R+1)².
      expect(level.space).toBeInstanceOf(HexSpace);
      expect(level.cols).toBe(5);
      expect(level.rows).toBe(5);
    });

    it('should build a HexMaskedSpace when the descriptor comes with a silhouette', () => {
      // Arrange — activas = unión de las regiones de la silueta (R=1, fila
      // central). La flecha vive dentro de la máscara.
      const silhouette = {
        stem: [[1, 0], [1, 1]] as [number, number][],
        tip: [[1, 2]] as [number, number][],
      };
      // Act
      const level = new LevelBuilder(new LevelId('l-hex-masked'))
        .withDimensions(0, 0)
        .withSpace({ type: 'hex', radius: 1 })
        .withSilhouette(silhouette)
        .addArrow({ id: 'a-0', headDir: 'downRight', cells: [[1, 1], [1, 0]] })
        .build();
      // Assert — la celda hex fuera de la máscara no pertenece al espacio.
      expect(level.space).toBeInstanceOf(HexMaskedSpace);
      expect(level.space.contains(new Position(0, 1))).toBe(false);
      expect(level.space.cellCount).toBe(3);
    });

    it('should reject an arrow whose headDir is foreign to the hex space', () => {
      // Arrange / Act / Assert — invariante de Level (back#58): right ∉ hex.
      expect(() =>
        new LevelBuilder(new LevelId('l-hex-bad-dir'))
          .withDimensions(0, 0)
          .withSpace({ type: 'hex', radius: 2 })
          .addArrow({ id: 'a-0', headDir: 'right', cells: [[2, 2], [2, 1]] })
          .build(),
      ).toThrow(InvalidLevelException);
    });

    it.each([
      [{ type: 'octo', radius: 2 }],
      [{ type: 'hex', radius: 0 }],
      [{ type: 'hex', radius: 1.5 }],
    ])('should throw for invalid space descriptor %o', (descriptor) => {
      // Act / Assert — fail-fast en construcción, no datos corruptos servidos.
      expect(() =>
        new LevelBuilder(new LevelId('l-bad-space'))
          .withDimensions(3, 3)
          .withSpace(descriptor as SpaceDescriptor)
          .addArrow({ id: 'a-0', headDir: 'up', cells: [[2, 2], [3, 2]] })
          .build(),
      ).toThrow(InvalidBoardSpaceException);
    });

    it('should accept hex as a first-class section', () => {
      // Arrange / Act
      const level = new LevelBuilder(new LevelId('l-hex-section'))
        .withDimensions(3, 3)
        .withSection('hex')
        .addArrow({ id: 'a-0', headDir: 'up', cells: [[1, 1], [2, 1]] })
        .build();
      // Assert
      expect(level.section).toBe('hex');
    });
  });
});
