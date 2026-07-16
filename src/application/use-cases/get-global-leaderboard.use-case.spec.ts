import { GetGlobalLeaderboardUseCase } from './get-global-leaderboard.use-case';
import type { IScoreRepository } from '../ports/i-score.repository';
import type { ILevelRepository } from '../ports/i-level.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import type { Level } from '../../domain/entities/level.entity';
import { LevelId } from '../../domain/value-objects/level-id.vo';

// RED (TDD): GetGlobalLeaderboardUseCase, GlobalLeaderboard y GlobalLeaderboardRow
// aun no existen. Este spec fija el contrato antes de implementar (A5).
describe('GetGlobalLeaderboardUseCase', () => {
  let sut: GetGlobalLeaderboardUseCase;
  let mockScoreRepo: jest.Mocked<
    IScoreRepository & {
      findGlobalTotals: (campaignLevelIds: LevelId[]) => Promise<
        Array<{
          userId: string;
          username: string;
          totalScore: number;
          totalStars: number;
        }>
      >;
    }
  >;
  let mockLevelRepo: jest.Mocked<ILevelRepository>;
  let mockLogger: jest.Mocked<ILoggerService>;

  // Solo se leen `section` e `id` (LevelId) del Level en este caso de uso.
  const campaignLevel = (id: string): Level =>
    ({ section: 'campaign', id: new LevelId(id) }) as unknown as Level;
  const themedLevel = (id: string): Level =>
    ({ section: 'themed', id: new LevelId(id) }) as unknown as Level;

  const total = (
    over: Partial<{
      userId: string;
      username: string;
      totalScore: number;
      totalStars: number;
    }> = {},
  ) => ({
    userId: 'u1',
    username: 'ana',
    totalScore: 900,
    totalStars: 12,
    ...over,
  });

  beforeEach(() => {
    mockScoreRepo = {
      save: jest.fn(),
      findLeaderboard: jest.fn(),
      findGlobalTotals: jest.fn(),
    };
    mockLevelRepo = { findById: jest.fn(), findAllOrdered: jest.fn() };
    mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    sut = new GetGlobalLeaderboardUseCase(
      mockScoreRepo,
      mockLevelRepo,
      mockLogger,
    );
  });

  it('passes only the campaign level ids to findGlobalTotals, excluding themed levels', async () => {
    // Arrange
    mockLevelRepo.findAllOrdered.mockResolvedValue([
      campaignLevel('l1'),
      campaignLevel('l2'),
      themedLevel('t1'),
      campaignLevel('l3'),
    ]);
    mockScoreRepo.findGlobalTotals.mockResolvedValue([]);
    // Act
    await sut.execute('u1');
    // Assert
    expect(mockScoreRepo.findGlobalTotals).toHaveBeenCalledTimes(1);
    const [idsArg] = mockScoreRepo.findGlobalTotals.mock.calls[0];
    expect(idsArg).toHaveLength(3);
    expect(idsArg.every((id) => id instanceof LevelId)).toBe(true);
    expect(idsArg.map((id) => id.value)).toEqual(['l1', 'l2', 'l3']);
  });

  it('sorts top by totalScore desc, tie-broken by totalStars desc', async () => {
    // Arrange
    mockLevelRepo.findAllOrdered.mockResolvedValue([campaignLevel('l1')]);
    mockScoreRepo.findGlobalTotals.mockResolvedValue([
      total({ userId: 'u1', username: 'ana', totalScore: 500, totalStars: 10 }),
      total({ userId: 'u2', username: 'leo', totalScore: 800, totalStars: 5 }),
      total({ userId: 'u3', username: 'mia', totalScore: 800, totalStars: 9 }),
    ]);
    // Act
    const result = await sut.execute('u1');
    // Assert
    expect(result.top.map((r) => r.userId)).toEqual(['u3', 'u2', 'u1']);
  });

  it('assigns rank 1..N over the full sorted set, not relative to a slice', async () => {
    // Arrange
    mockLevelRepo.findAllOrdered.mockResolvedValue([campaignLevel('l1')]);
    mockScoreRepo.findGlobalTotals.mockResolvedValue([
      total({ userId: 'u1', totalScore: 100 }),
      total({ userId: 'u2', totalScore: 300 }),
      total({ userId: 'u3', totalScore: 200 }),
    ]);
    // Act
    const result = await sut.execute('u1', 2);
    // Assert
    expect(result.top.map((r) => ({ userId: r.userId, rank: r.rank }))).toEqual(
      [
        { userId: 'u2', rank: 1 },
        { userId: 'u3', rank: 2 },
      ],
    );
    expect(result.me).toEqual(
      expect.objectContaining({ userId: 'u1', rank: 3 }),
    );
  });

  it('trims top to limit but keeps the real rank for me when the user is below the top', async () => {
    // Arrange
    mockLevelRepo.findAllOrdered.mockResolvedValue([campaignLevel('l1')]);
    mockScoreRepo.findGlobalTotals.mockResolvedValue([
      total({ userId: 'u1', totalScore: 400 }),
      total({ userId: 'u2', totalScore: 350 }),
      total({ userId: 'u3', totalScore: 300 }),
      total({ userId: 'u4', totalScore: 10 }),
    ]);
    // Act
    const result = await sut.execute('u4', 2);
    // Assert
    expect(result.top).toHaveLength(2);
    expect(result.top.map((r) => r.userId)).toEqual(['u1', 'u2']);
    expect(result.me).toEqual(
      expect.objectContaining({ userId: 'u4', rank: 4 }),
    );
  });

  it('returns me as null when the requesting user has no totals', async () => {
    // Arrange
    mockLevelRepo.findAllOrdered.mockResolvedValue([campaignLevel('l1')]);
    mockScoreRepo.findGlobalTotals.mockResolvedValue([
      total({ userId: 'u1', totalScore: 100 }),
    ]);
    // Act
    const result = await sut.execute('ghost-user');
    // Assert
    expect(result.me).toBeNull();
  });

  it('falls back to the default limit (50) capped at 100 when limit is invalid', async () => {
    // Arrange
    mockLevelRepo.findAllOrdered.mockResolvedValue([campaignLevel('l1')]);
    const many = Array.from({ length: 120 }, (_, i) =>
      total({ userId: `u${i}`, totalScore: 120 - i }),
    );
    mockScoreRepo.findGlobalTotals.mockResolvedValue(many);
    // Act
    const defaultResult = await sut.execute('u0', 0);
    const cappedResult = await sut.execute('u0', 5000);
    // Assert
    expect(defaultResult.top).toHaveLength(50);
    expect(cappedResult.top).toHaveLength(100);
  });
});
