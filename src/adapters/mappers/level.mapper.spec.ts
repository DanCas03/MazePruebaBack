import { LevelMapper } from './level.mapper';
import { Level } from '../../domain/entities/level.entity';
import type {
  LevelPaint,
  LevelSilhouette,
} from '../../domain/entities/level.entity';
import { Arrow } from '../../domain/entities/arrow.entity';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { ArrowId } from '../../domain/value-objects/arrow-id.vo';
import { Position } from '../../domain/value-objects/position.vo';
import { Direction } from '../../domain/value-objects/direction.vo';
import { RectSpace } from '../../domain/space/rect-space';
import { HexSpace } from '../../domain/space/hex-space';

// Passthrough del wire temático (ADR 0004, back#31): el mapper copia
// section/palette/paintRole tal cual — datos opacos, sin interpretación.
describe('LevelMapper', () => {
  const arrowA1 = () =>
    new Arrow(
      new ArrowId('a1'),
      [new Position(3, 4), new Position(3, 5)],
      Direction.UP,
    );

  const arrowA2 = () =>
    new Arrow(
      new ArrowId('a2'),
      [new Position(5, 0), new Position(5, 1)],
      Direction.RIGHT,
    );

  const campaignLevel = () =>
    new Level(
      new LevelId('l-007'),
      new RectSpace(8, 11),
      [arrowA1(), arrowA2()],
      90,
    );

  const themedPaint = (): LevelPaint => ({
    palette: { cara: '#FBBF24', ojo: '#1E293B' },
    roles: { a1: 'cara' },
  });

  const themedLevel = () =>
    new Level(
      new LevelId('t-smiley'),
      new RectSpace(20, 20),
      [arrowA1(), arrowA2()],
      90,
      'themed',
      themedPaint(),
    );

  const themedSilhouette = (): LevelSilhouette => ({
    cara: [
      [3, 4],
      [3, 5],
    ],
    ojo: [
      [5, 0],
      [5, 1],
    ],
  });

  const themedLevelWithSilhouette = () =>
    new Level(
      new LevelId('t-smiley'),
      new RectSpace(20, 20),
      [arrowA1(), arrowA2()],
      90,
      'themed',
      themedPaint(),
      themedSilhouette(),
    );

  // Descriptor de geometría (ADR-0007, back#59): presente solo en niveles hex.
  const hexLevel = () =>
    new Level(
      new LevelId('l-hex-dto'),
      new HexSpace(2),
      [
        new Arrow(
          new ArrowId('a-0'),
          [new Position(2, 2), new Position(3, 2)],
          Direction.UP,
        ),
      ],
      90,
      'hex',
    );

  describe('toSummaryDto', () => {
    it('should expose section campaign when the level carries no explicit section (retro-compat)', () => {
      // Arrange
      const level = campaignLevel();
      // Act
      const dto = LevelMapper.toSummaryDto(level);
      // Assert
      expect(dto).toEqual({ levelId: 'l-007', section: 'campaign' });
    });

    it('should expose section themed for a themed level', () => {
      // Arrange
      const level = themedLevel();
      // Act
      const dto = LevelMapper.toSummaryDto(level);
      // Assert
      expect(dto).toEqual({ levelId: 't-smiley', section: 'themed' });
    });
  });

  describe('toDto', () => {
    it('should omit palette and paintRole entirely when the level has no paint carrier', () => {
      // Arrange
      const level = campaignLevel();
      // Act
      const dto = LevelMapper.toDto(level);
      // Assert
      expect(dto).not.toHaveProperty('palette');
      dto.arrows.forEach((arrow) => {
        expect(arrow).not.toHaveProperty('paintRole');
      });
    });

    it('should pass palette and per-arrow paintRole through intact for a themed level', () => {
      // Arrange
      const level = themedLevel();
      // Act
      const dto = LevelMapper.toDto(level);
      // Assert
      expect(dto.palette).toEqual({ cara: '#FBBF24', ojo: '#1E293B' });
      expect(dto.arrows[0]).toEqual({
        id: 'a1',
        headDir: 'up',
        cells: [
          [3, 4],
          [3, 5],
        ],
        paintRole: 'cara',
      });
      // a2 no tiene rol asignado: la clave no debe aparecer.
      expect(dto.arrows[1]).not.toHaveProperty('paintRole');
    });

    it('should keep the mechanical wire contract unchanged for a themed level (cols, rows, arrows)', () => {
      // Arrange
      const level = themedLevel();
      // Act
      const dto = LevelMapper.toDto(level);
      // Assert
      expect(dto.levelId).toBe('t-smiley');
      expect(dto.cols).toBe(20);
      expect(dto.rows).toBe(20);
      expect(dto.arrows).toHaveLength(2);
      expect(dto.arrows[1].id).toBe('a2');
      expect(dto.arrows[1].headDir).toBe('right');
    });

    it('should omit silhouette entirely when the level has no silhouette carrier (#53)', () => {
      // Arrange — nivel temático CON paint pero sin silhouette (retro-compat
      // de temáticos previos a back#53).
      const level = themedLevel();
      // Act
      const dto = LevelMapper.toDto(level);
      // Assert
      expect(dto).not.toHaveProperty('silhouette');
    });

    it('should pass silhouette through intact for a themed level (deep equality round-trip, #53)', () => {
      // Arrange
      const level = themedLevelWithSilhouette();
      // Act
      const dto = LevelMapper.toDto(level);
      // Assert
      expect(dto.silhouette).toEqual({
        cara: [
          [3, 4],
          [3, 5],
        ],
        ojo: [
          [5, 0],
          [5, 1],
        ],
      });
    });
  });

  // back#59: descriptor de geometría en el DTO — presente solo en niveles hex.
  describe('space descriptor (back#59)', () => {
    it('should expose the hex space descriptor with bounding-box cols/rows', () => {
      // Arrange
      const level = hexLevel();
      // Act
      const dto = LevelMapper.toDto(level);
      // Assert
      expect(dto.space).toEqual({ type: 'hex', radius: 2 });
      expect(dto.cols).toBe(5);
      expect(dto.rows).toBe(5);
    });

    it('should omit the space field entirely for rectangular levels', () => {
      // Arrange
      const level = campaignLevel();
      // Act
      const dto = LevelMapper.toDto(level);
      // Assert — retrocompat byte a byte: la clave ni siquiera existe.
      expect('space' in dto).toBe(false);
    });
  });
});
