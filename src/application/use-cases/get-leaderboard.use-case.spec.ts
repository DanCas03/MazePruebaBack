import { GetLeaderboardUseCase } from './get-leaderboard.use-case';
import type { IScoreRepository } from '../ports/i-score.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import type { LeaderboardRow } from '../read-models/leaderboard-row';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { InvalidLevelIdException } from '../../domain/exceptions/invalid-level-id.exception';

describe('GetLeaderboardUseCase', () => {
  let sut: GetLeaderboardUseCase;
  let mockScoreRepo: jest.Mocked<IScoreRepository>;
  let mockLogger: jest.Mocked<ILoggerService>;

  const row = (over: Partial<LeaderboardRow> = {}): LeaderboardRow => ({
    id: 'r1',
    userId: 'u1',
    username: 'ana',
    levelId: 'level-1',
    score: 900,
    stars: 3,
    moves: 12,
    timeSeconds: 45,
    createdAt: new Date('2026-07-01T10:30:00.000Z'),
    ...over,
  });

  beforeEach(() => {
    mockScoreRepo = { save: jest.fn(), findLeaderboard: jest.fn() };
    mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    sut = new GetLeaderboardUseCase(mockScoreRepo, mockLogger);
  });

  it('queries with the level id and the default limit when none is given', async () => {
    // Arrange
    mockScoreRepo.findLeaderboard.mockResolvedValue([]);
    // Act
    await sut.execute('level-1');
    // Assert
    expect(mockScoreRepo.findLeaderboard).toHaveBeenCalledTimes(1);
    const [levelIdArg, limitArg] = mockScoreRepo.findLeaderboard.mock.calls[0];
    expect(levelIdArg).toBeInstanceOf(LevelId);
    expect(levelIdArg.value).toBe('level-1');
    expect(limitArg).toBe(GetLeaderboardUseCase.DEFAULT_LIMIT);
  });

  it('returns the rows produced by the repository (with username)', async () => {
    // Arrange
    const rows = [row({ username: 'ana' }), row({ id: 'r2', username: 'leo' })];
    mockScoreRepo.findLeaderboard.mockResolvedValue(rows);
    // Act
    const result = await sut.execute('level-1', 5);
    // Assert
    expect(result).toBe(rows);
    expect(mockScoreRepo.findLeaderboard).toHaveBeenCalledWith(
      expect.any(LevelId),
      5,
    );
  });

  it('clamps a limit above the maximum down to MAX_LIMIT', async () => {
    // Arrange
    mockScoreRepo.findLeaderboard.mockResolvedValue([]);
    // Act
    await sut.execute('level-1', 5000);
    // Assert
    expect(mockScoreRepo.findLeaderboard).toHaveBeenCalledWith(
      expect.any(LevelId),
      GetLeaderboardUseCase.MAX_LIMIT,
    );
  });

  it('falls back to the default limit when the limit is not a positive integer', async () => {
    // Arrange
    mockScoreRepo.findLeaderboard.mockResolvedValue([]);
    // Act
    await sut.execute('level-1', 0);
    // Assert
    expect(mockScoreRepo.findLeaderboard).toHaveBeenCalledWith(
      expect.any(LevelId),
      GetLeaderboardUseCase.DEFAULT_LIMIT,
    );
  });

  it('throws InvalidLevelIdException when the level id is empty', async () => {
    // Act / Assert
    await expect(sut.execute('')).rejects.toThrow(InvalidLevelIdException);
    expect(mockScoreRepo.findLeaderboard).not.toHaveBeenCalled();
  });
});
