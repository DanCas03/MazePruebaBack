import { PrismaScoreRepository } from './prisma-score.repository';
import { PrismaService } from './prisma.service';
import { ScoreEntry } from '../../domain/entities/score-entry.entity';
import { ScoreEntryId } from '../../domain/value-objects/score-entry-id.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';
import { MoveCount } from '../../domain/value-objects/move-count.vo';
import { ElapsedTime } from '../../domain/value-objects/elapsed-time.vo';

describe('PrismaScoreRepository', () => {
  let sut: PrismaScoreRepository;
  let mockPrisma: {
    scoreEntry: { create: jest.Mock; findMany: jest.Mock; groupBy: jest.Mock };
    user: { findMany: jest.Mock };
  };

  beforeEach(() => {
    mockPrisma = {
      scoreEntry: {
        create: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
      user: { findMany: jest.fn() },
    };
    sut = new PrismaScoreRepository(mockPrisma as unknown as PrismaService);
  });

  describe('save', () => {
    it('should flatten the ScoreEntry value objects into persistence columns', async () => {
      // Arrange
      const createdAt = new Date('2026-07-08T00:00:00Z');
      const entry = new ScoreEntry(
        new ScoreEntryId('score-1'),
        new UserId('user-1'),
        new LevelId('level-1'),
        new Score(1500),
        new Stars(3),
        new MoveCount(12),
        new ElapsedTime(45),
        createdAt,
      );
      // Act
      await sut.save(entry);
      // Assert
      expect(mockPrisma.scoreEntry.create).toHaveBeenCalledWith({
        data: {
          id: 'score-1',
          userId: 'user-1',
          levelId: 'level-1',
          score: 1500,
          stars: 3,
          moves: 12,
          timeSeconds: 45,
          createdAt,
        },
      });
    });
  });

  describe('findLeaderboard', () => {
    it('should query filtered by level, ordered by score desc, capped by limit', async () => {
      // Arrange
      mockPrisma.scoreEntry.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      // Act
      await sut.findLeaderboard(new LevelId('level-1'), 5);
      // Assert
      expect(mockPrisma.scoreEntry.findMany).toHaveBeenCalledWith({
        where: { levelId: 'level-1' },
        orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
        take: 5,
      });
    });

    it('should resolve the username for each score by joining against User', async () => {
      // Arrange
      const createdAt = new Date('2026-07-08T00:00:00Z');
      mockPrisma.scoreEntry.findMany.mockResolvedValue([
        {
          id: 'score-1',
          userId: 'user-1',
          levelId: 'level-1',
          score: 1500,
          stars: 3,
          moves: 12,
          timeSeconds: 45,
          createdAt,
        },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', username: 'ana' },
      ]);
      // Act
      const result = await sut.findLeaderboard(new LevelId('level-1'), 10);
      // Assert
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1'] } },
        select: { id: true, username: true },
      });
      expect(result).toEqual([
        {
          id: 'score-1',
          userId: 'user-1',
          username: 'ana',
          levelId: 'level-1',
          score: 1500,
          stars: 3,
          moves: 12,
          timeSeconds: 45,
          createdAt,
        },
      ]);
    });

    it('should fall back to a synthetic username when the score has no matching user', async () => {
      // Arrange
      const createdAt = new Date('2026-07-08T00:00:00Z');
      mockPrisma.scoreEntry.findMany.mockResolvedValue([
        {
          id: 'score-1',
          userId: 'orphan-user-id',
          levelId: 'level-1',
          score: 1500,
          stars: 3,
          moves: 12,
          timeSeconds: 45,
          createdAt,
        },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      // Act
      const result = await sut.findLeaderboard(new LevelId('level-1'), 10);
      // Assert
      expect(result[0].username).toBe('player_orphan-u');
    });
  });

  describe('findGlobalTotals', () => {
    it('should groupBy userId and levelId filtered to the given campaign level ids', async () => {
      // Arrange
      mockPrisma.scoreEntry.groupBy.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      // Act
      await sut.findGlobalTotals([
        new LevelId('level-1'),
        new LevelId('level-2'),
      ]);
      // Assert
      expect(mockPrisma.scoreEntry.groupBy).toHaveBeenCalledWith({
        by: ['userId', 'levelId'],
        where: { levelId: { in: ['level-1', 'level-2'] } },
        _max: { score: true, stars: true },
      });
    });

    it('should sum the best score and best stars per user across the grouped levels', async () => {
      // Arrange
      mockPrisma.scoreEntry.groupBy.mockResolvedValue([
        {
          userId: 'user-1',
          levelId: 'level-1',
          _max: { score: 500, stars: 3 },
        },
        {
          userId: 'user-1',
          levelId: 'level-2',
          _max: { score: 300, stars: 2 },
        },
        {
          userId: 'user-2',
          levelId: 'level-1',
          _max: { score: 100, stars: 1 },
        },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', username: 'ana' },
        { id: 'user-2', username: 'leo' },
      ]);
      // Act
      const result = await sut.findGlobalTotals([
        new LevelId('level-1'),
        new LevelId('level-2'),
      ]);
      // Assert
      expect(result).toEqual(
        expect.arrayContaining([
          { userId: 'user-1', username: 'ana', totalScore: 800, totalStars: 5 },
          { userId: 'user-2', username: 'leo', totalScore: 100, totalStars: 1 },
        ]),
      );
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1', 'user-2'] } },
        select: { id: true, username: true },
      });
    });

    it('should fall back to a synthetic username when a grouped userId has no matching user', async () => {
      // Arrange
      mockPrisma.scoreEntry.groupBy.mockResolvedValue([
        {
          userId: 'orphan-user-id',
          levelId: 'level-1',
          _max: { score: 500, stars: 3 },
        },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      // Act
      const result = await sut.findGlobalTotals([new LevelId('level-1')]);
      // Assert
      expect(result).toEqual([
        {
          userId: 'orphan-user-id',
          username: 'player_orphan-u',
          totalScore: 500,
          totalStars: 3,
        },
      ]);
    });
  });
});
