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
  let mockPrisma: { scoreEntry: { create: jest.Mock; findMany: jest.Mock } };

  beforeEach(() => {
    mockPrisma = { scoreEntry: { create: jest.fn(), findMany: jest.fn() } };
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

  describe('findTopByLevel', () => {
    it('should query filtered by level, ordered by score desc, capped by limit', async () => {
      // Arrange
      mockPrisma.scoreEntry.findMany.mockResolvedValue([]);
      // Act
      await sut.findTopByLevel(new LevelId('level-1'), 5);
      // Assert
      expect(mockPrisma.scoreEntry.findMany).toHaveBeenCalledWith({
        where: { levelId: 'level-1' },
        orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
        take: 5,
      });
    });

    it('should rebuild ScoreEntry domain entities from the persistence records', async () => {
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
      // Act
      const result = await sut.findTopByLevel(new LevelId('level-1'), 10);
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ScoreEntry);
      expect(result[0].score.value).toBe(1500);
      expect(result[0].stars.value).toBe(3);
      expect(result[0].time.seconds).toBe(45);
      expect(result[0].createdAt).toBe(createdAt);
    });
  });
});
