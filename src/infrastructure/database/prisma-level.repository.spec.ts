import { PrismaLevelRepository } from './prisma-level.repository';
import { PrismaService } from './prisma.service';
import { Level } from '../../domain/entities/level.entity';
import { LevelId } from '../../domain/value-objects/level-id.vo';

describe('PrismaLevelRepository', () => {
  let sut: PrismaLevelRepository;
  let mockPrisma: {
    level: { findUnique: jest.Mock; findMany: jest.Mock };
  };

  beforeEach(() => {
    mockPrisma = {
      level: { findUnique: jest.fn(), findMany: jest.fn() },
    };
    sut = new PrismaLevelRepository(mockPrisma as unknown as PrismaService);
  });

  // Fixture: ejemplo exacto del wire contract (CONTEXT-MAP.md).
  const wireContractRecord = (
    overrides: Partial<{ timeLimitSec?: number }> = {},
  ) => ({
    id: 'l-007',
    order: 1,
    data: {
      cols: 8,
      rows: 11,
      timeLimitSec: 90,
      arrows: [
        {
          id: 'a1',
          headDir: 'up',
          cells: [
            [10, 3],
            [9, 3],
            [9, 4],
          ],
        },
        {
          id: 'a2',
          headDir: 'right',
          cells: [
            [2, 0],
            [2, 1],
          ],
        },
      ],
      ...overrides,
    },
  });

  describe('findById', () => {
    it('should query by id and rebuild a Level from the stored arrow-path data', async () => {
      // Arrange
      mockPrisma.level.findUnique.mockResolvedValue(wireContractRecord());

      // Act
      const result = await sut.findById(new LevelId('l-007'));

      // Assert
      expect(mockPrisma.level.findUnique).toHaveBeenCalledWith({
        where: { id: 'l-007' },
      });
      expect(result).toBeInstanceOf(Level);
      expect(result?.id.value).toBe('l-007');
      expect(result?.cols).toBe(8);
      expect(result?.rows).toBe(11);
      expect(result?.timeLimitSec).toBe(90);
      expect(result?.arrows).toHaveLength(2);
      expect(result?.arrows[0].id.value).toBe('a1');
      expect(result?.arrows[0].headDir).toBe('up');
      expect(result?.arrows[1].id.value).toBe('a2');
      expect(result?.arrows[1].headDir).toBe('right');
    });

    it('should return null without throwing when no record is found', async () => {
      // Arrange
      mockPrisma.level.findUnique.mockResolvedValue(null);

      // Act
      const result = await sut.findById(new LevelId('missing'));

      // Assert
      expect(result).toBeNull();
    });

    it('should rebuild a Level with the provisional timeLimitSec when legacy stored data omits it (ADR 0006)', async () => {
      // Arrange — record legado (pre-regeneración) sin timeLimitSec; 2
      // flechas ⇒ provisional del builder = max(30, 2*6) = 30.
      const record = wireContractRecord();
      delete (record.data as { timeLimitSec?: number }).timeLimitSec;
      mockPrisma.level.findUnique.mockResolvedValue(record);

      // Act
      const result = await sut.findById(new LevelId('l-007'));

      // Assert
      expect(result?.timeLimitSec).toBe(30);
    });

    it('should default to campaign section without paint when the record predates back#31 (retro-compat)', async () => {
      // Arrange — record sin columna section ni palette, como los datos viejos.
      mockPrisma.level.findUnique.mockResolvedValue(wireContractRecord());

      // Act
      const result = await sut.findById(new LevelId('l-007'));

      // Assert
      expect(result?.section).toBe('campaign');
      expect(result?.paint).toBeUndefined();
      expect(result?.silhouette).toBeUndefined();
    });

    it('should rebuild a themed Level lifting silhouette into the domain carrier (back#53)', async () => {
      // Arrange — temático con silhouette: clave = región, valor = celdas de relleno.
      const themedRecord = {
        id: 't-smiley',
        order: null,
        section: 'themed',
        data: {
          cols: 20,
          rows: 20,
          palette: { cara: '#FBBF24', ojo: '#1E293B' },
          silhouette: {
            cara: [
              [3, 4],
              [3, 5],
            ],
            ojo: [
              [5, 0],
              [5, 1],
            ],
          },
          arrows: [
            {
              id: 'a1',
              headDir: 'up',
              cells: [
                [3, 4],
                [3, 5],
              ],
              paintRole: 'cara',
            },
          ],
        },
      };
      mockPrisma.level.findUnique.mockResolvedValue(themedRecord);

      // Act
      const result = await sut.findById(new LevelId('t-smiley'));

      // Assert
      expect(result?.silhouette).toEqual({
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

    it('should rebuild a themed Level lifting palette and per-arrow paintRole into the paint carrier (ADR 0004)', async () => {
      // Arrange — temático: order null, section themed, palette + paintRole.
      const themedRecord = {
        id: 't-smiley',
        order: null,
        section: 'themed',
        data: {
          cols: 20,
          rows: 20,
          palette: { cara: '#FBBF24', ojo: '#1E293B' },
          arrows: [
            {
              id: 'a1',
              headDir: 'up',
              cells: [
                [3, 4],
                [3, 5],
              ],
              paintRole: 'cara',
            },
            {
              id: 'a2',
              headDir: 'right',
              cells: [
                [5, 0],
                [5, 1],
              ],
            },
          ],
        },
      };
      mockPrisma.level.findUnique.mockResolvedValue(themedRecord);

      // Act
      const result = await sut.findById(new LevelId('t-smiley'));

      // Assert
      expect(result?.section).toBe('themed');
      expect(result?.paint).toEqual({
        palette: { cara: '#FBBF24', ojo: '#1E293B' },
        roles: { a1: 'cara' },
      });
      expect(result?.arrows).toHaveLength(2);
    });
  });

  describe('findAllOrdered', () => {
    it('should query ordered ascending by order and rebuild every record to a Level', async () => {
      // Arrange
      const first = {
        id: 'l-001',
        order: 1,
        data: {
          cols: 2,
          rows: 2,
          arrows: [
            {
              id: 'a1',
              headDir: 'right',
              cells: [
                [0, 0],
                [0, 1],
              ],
            },
          ],
        },
      };
      const second = {
        id: 'l-002',
        order: 2,
        data: {
          cols: 2,
          rows: 2,
          arrows: [
            {
              id: 'a1',
              headDir: 'down',
              cells: [
                [0, 0],
                [1, 0],
              ],
            },
          ],
        },
      };
      mockPrisma.level.findMany.mockResolvedValue([first, second]);

      // Act
      const result = await sut.findAllOrdered();

      // Assert
      expect(mockPrisma.level.findMany).toHaveBeenCalledWith({
        orderBy: [{ order: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Level);
      expect(result[0].id.value).toBe('l-001');
      expect(result[1].id.value).toBe('l-002');
    });

    it('should return an empty array without throwing when no levels are stored', async () => {
      // Arrange
      mockPrisma.level.findMany.mockResolvedValue([]);

      // Act
      const result = await sut.findAllOrdered();

      // Assert
      expect(result).toEqual([]);
    });
  });
});
