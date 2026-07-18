import {
  LEVEL_FIXTURE_FILENAME_PATTERN,
  LevelFixture,
  buildLevelFromFixture,
  fixtureToData,
  resolveSection,
  suggestTimeLimitSec,
} from './level-fixture';
import { HexSpace } from '../../domain/space/hex-space';
import { HexMaskedSpace } from '../../domain/space/hex-masked-space';
import { RectSpace } from '../../domain/space/rect-space';

describe('level-fixture (back#60)', () => {
  describe('buildLevelFromFixture', () => {
    it('builds a full HexSpace when space is hex and no silhouette', () => {
      // Arrange
      const fixture: LevelFixture = {
        levelId: 'hex-x',
        section: 'hex',
        cols: 7,
        rows: 7,
        space: { type: 'hex', radius: 3 },
        timeLimitSec: 45,
        arrows: [
          {
            id: 'a',
            headDir: 'up',
            cells: [
              [3, 3],
              [4, 3],
            ],
          },
        ],
      };
      // Act
      const level = buildLevelFromFixture(fixture);
      // Assert
      expect(level.space).toBeInstanceOf(HexSpace);
      expect(level.space).not.toBeInstanceOf(HexMaskedSpace);
    });

    it('builds a HexMaskedSpace when space is hex and a silhouette is present', () => {
      // Arrange
      const fixture: LevelFixture = {
        levelId: 't-x',
        section: 'themed',
        cols: 11,
        rows: 11,
        space: { type: 'hex', radius: 5 },
        palette: { snow: '#E8F4FF' },
        silhouette: {
          snow: [
            [5, 5],
            [4, 5],
          ],
        },
        arrows: [
          {
            id: 'a',
            headDir: 'up',
            cells: [
              [4, 5],
              [5, 5],
            ],
            paintRole: 'snow',
          },
        ],
      };
      // Act
      const level = buildLevelFromFixture(fixture);
      // Assert
      expect(level.space).toBeInstanceOf(HexMaskedSpace);
    });

    it('builds a RectSpace when space is absent (backward compat)', () => {
      // Arrange
      const fixture: LevelFixture = {
        levelId: 'level-x',
        order: 1,
        cols: 3,
        rows: 3,
        timeLimitSec: 30,
        arrows: [
          {
            id: 'a',
            headDir: 'right',
            cells: [
              [1, 0],
              [1, 1],
            ],
          },
        ],
      };
      // Act
      const level = buildLevelFromFixture(fixture);
      // Assert
      expect(level.space).toBeInstanceOf(RectSpace);
    });

    it('accepts diagonal hex headDir (proves withSpace is applied, not RectSpace)', () => {
      // Arrange — 'upRight' would throw InvalidLevelException on a RectSpace.
      const fixture: LevelFixture = {
        levelId: 'hex-diag',
        section: 'hex',
        cols: 5,
        rows: 5,
        space: { type: 'hex', radius: 2 },
        timeLimitSec: 30,
        arrows: [
          {
            id: 'a',
            headDir: 'upRight',
            cells: [
              [2, 2],
              [3, 1],
            ],
          },
        ],
      };
      // Act + Assert
      expect(() => buildLevelFromFixture(fixture)).not.toThrow();
    });
  });

  describe('fixtureToData', () => {
    it('includes space when present', () => {
      // Arrange
      const fixture: LevelFixture = {
        levelId: 'hex-x',
        section: 'hex',
        cols: 7,
        rows: 7,
        space: { type: 'hex', radius: 3 },
        timeLimitSec: 45,
        arrows: [
          {
            id: 'a',
            headDir: 'up',
            cells: [
              [3, 3],
              [4, 3],
            ],
          },
        ],
      };
      // Act
      const data = fixtureToData(fixture) as Record<string, unknown>;
      // Assert
      expect(data.space).toEqual({ type: 'hex', radius: 3 });
    });

    it('is byte-identical for rect fixtures (no space key)', () => {
      // Arrange
      const fixture: LevelFixture = {
        levelId: 'level-x',
        order: 1,
        cols: 3,
        rows: 3,
        timeLimitSec: 30,
        arrows: [
          {
            id: 'a',
            headDir: 'right',
            cells: [
              [1, 0],
              [1, 1],
            ],
          },
        ],
      };
      // Act
      const data = fixtureToData(fixture);
      // Assert
      expect(data).toEqual({
        cols: 3,
        rows: 3,
        timeLimitSec: 30,
        arrows: [
          {
            id: 'a',
            headDir: 'right',
            cells: [
              [1, 0],
              [1, 1],
            ],
          },
        ],
      });
      expect(data).not.toHaveProperty('space');
    });
  });

  describe('resolveSection', () => {
    it.each([
      ['hex', 'hex'],
      ['themed', 'themed'],
      [undefined, 'campaign'],
      ['garbage', 'campaign'],
    ])('maps section %s -> %s', (input, expected) => {
      expect(
        resolveSection({
          levelId: 'x',
          cols: 1,
          rows: 1,
          section: input,
          arrows: [],
        }),
      ).toBe(expected);
    });
  });

  describe('LEVEL_FIXTURE_FILENAME_PATTERN', () => {
    it.each([
      'level-01.json',
      't-heart.json',
      't-snowflake.json',
      'hex-01.json',
      'hex-12.json',
    ])('matches %s', (filename) => {
      expect(LEVEL_FIXTURE_FILENAME_PATTERN.test(filename)).toBe(true);
    });

    it.each(['manifest.md', 'hex.json', 'level-01.json.bak', 'notes.txt'])(
      'rejects %s',
      (filename) => {
        expect(LEVEL_FIXTURE_FILENAME_PATTERN.test(filename)).toBe(false);
      },
    );
  });

  describe('suggestTimeLimitSec', () => {
    it.each([
      [10, 45],
      [17, 75],
      [27, 120],
      [7, 30],
      [0, 30],
    ])('len %i -> %i s', (len, expected) => {
      expect(suggestTimeLimitSec(len)).toBe(expected);
    });
  });
});
