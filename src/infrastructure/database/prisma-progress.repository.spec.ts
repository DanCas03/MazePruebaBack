import { PrismaProgressRepository } from './prisma-progress.repository';
import { PrismaService } from './prisma.service';
import { ProgressEntry } from '../../domain/entities/progress-entry.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';

describe('PrismaProgressRepository', () => {
  let sut: PrismaProgressRepository;
  let mockPrisma: {
    progress: { findMany: jest.Mock; findUnique: jest.Mock; upsert: jest.Mock };
  };

  beforeEach(() => {
    mockPrisma = {
      progress: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };
    sut = new PrismaProgressRepository(mockPrisma as unknown as PrismaService);
  });

  describe('findAllByUser', () => {
    it('should query filtered by userId and rebuild domain entities', async () => {
      // Arrange
      mockPrisma.progress.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          levelId: 'level-1',
          completed: true,
          bestScore: 1200,
          bestStars: 3,
        },
      ]);

      // Act
      const result = await sut.findAllByUser(new UserId('user-1'));

      // Assert
      expect(mockPrisma.progress.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ProgressEntry);
      expect(result[0].bestScore?.value).toBe(1200);
      expect(result[0].bestStars?.value).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should query by the composite (userId, levelId) key', async () => {
      // Arrange
      mockPrisma.progress.findUnique.mockResolvedValue(null);

      // Act
      const result = await sut.findOne(
        new UserId('user-1'),
        new LevelId('level-1'),
      );

      // Assert
      expect(mockPrisma.progress.findUnique).toHaveBeenCalledWith({
        where: { userId_levelId: { userId: 'user-1', levelId: 'level-1' } },
      });
      expect(result).toBeNull();
    });

    it('should rebuild a null-score entry when bestScore/bestStars are null', async () => {
      // Arrange
      mockPrisma.progress.findUnique.mockResolvedValue({
        userId: 'user-1',
        levelId: 'level-1',
        completed: false,
        bestScore: null,
        bestStars: null,
      });

      // Act
      const result = await sut.findOne(
        new UserId('user-1'),
        new LevelId('level-1'),
      );

      // Assert
      expect(result?.bestScore).toBeNull();
      expect(result?.bestStars).toBeNull();
    });
  });

  describe('upsert', () => {
    it('should flatten the ProgressEntry into create/update payloads keyed by (userId, levelId)', async () => {
      // Arrange
      const entry = new ProgressEntry(
        new UserId('user-1'),
        new LevelId('level-1'),
        true,
        new Score(1200),
        new Stars(3),
      );

      // Act
      await sut.upsert(entry);

      // Assert
      expect(mockPrisma.progress.upsert).toHaveBeenCalledWith({
        where: { userId_levelId: { userId: 'user-1', levelId: 'level-1' } },
        create: {
          userId: 'user-1',
          levelId: 'level-1',
          completed: true,
          bestScore: 1200,
          bestStars: 3,
        },
        update: { completed: true, bestScore: 1200, bestStars: 3 },
      });
    });

    it('should persist null bestScore/bestStars when the entry has none', async () => {
      // Arrange
      const entry = new ProgressEntry(
        new UserId('user-1'),
        new LevelId('level-1'),
        true,
        null,
        null,
      );

      // Act
      await sut.upsert(entry);

      // Assert
      expect(mockPrisma.progress.upsert).toHaveBeenCalledWith({
        where: { userId_levelId: { userId: 'user-1', levelId: 'level-1' } },
        create: {
          userId: 'user-1',
          levelId: 'level-1',
          completed: true,
          bestScore: null,
          bestStars: null,
        },
        update: { completed: true, bestScore: null, bestStars: null },
      });
    });
  });
});
