import { GetLeaderboardUseCase } from './get-leaderboard.use-case';
import type { IScoreRepository } from '../ports/i-score.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { InvalidLevelIdException } from '../../domain/exceptions/invalid-level-id.exception';

describe('GetLeaderboardUseCase', () => {
  let sut: GetLeaderboardUseCase;
  let mockScoreRepo: jest.Mocked<IScoreRepository>;
  let mockLogger: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    mockScoreRepo = { save: jest.fn(), findTopByLevel: jest.fn() };
    mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    sut = new GetLeaderboardUseCase(mockScoreRepo, mockLogger);
  });

  it('should query the repository with the level id and the default limit when none is given', async () => {
    // Arrange
    mockScoreRepo.findTopByLevel.mockResolvedValue([]);
    // Act
    await sut.execute('level-1');
    // Assert
    expect(mockScoreRepo.findTopByLevel).toHaveBeenCalledTimes(1);
    const [levelIdArg, limitArg] = mockScoreRepo.findTopByLevel.mock.calls[0];
    expect(levelIdArg).toBeInstanceOf(LevelId);
    expect(levelIdArg.value).toBe('level-1');
    expect(limitArg).toBe(GetLeaderboardUseCase.DEFAULT_LIMIT);
  });

  it('should return the entries produced by the repository', async () => {
    // Arrange
    const entries = [{ id: {} } as any, { id: {} } as any];
    mockScoreRepo.findTopByLevel.mockResolvedValue(entries);
    // Act
    const result = await sut.execute('level-1', 5);
    // Assert
    expect(result).toBe(entries);
    expect(mockScoreRepo.findTopByLevel).toHaveBeenCalledWith(
      expect.any(LevelId),
      5,
    );
  });

  it('should clamp a limit above the maximum down to MAX_LIMIT', async () => {
    // Arrange
    mockScoreRepo.findTopByLevel.mockResolvedValue([]);
    // Act
    await sut.execute('level-1', 5000);
    // Assert
    expect(mockScoreRepo.findTopByLevel).toHaveBeenCalledWith(
      expect.any(LevelId),
      GetLeaderboardUseCase.MAX_LIMIT,
    );
  });

  it('should fall back to the default limit when the limit is not a positive integer', async () => {
    // Arrange
    mockScoreRepo.findTopByLevel.mockResolvedValue([]);
    // Act
    await sut.execute('level-1', 0);
    // Assert
    expect(mockScoreRepo.findTopByLevel).toHaveBeenCalledWith(
      expect.any(LevelId),
      GetLeaderboardUseCase.DEFAULT_LIMIT,
    );
  });

  it('should throw InvalidLevelIdException when the level id is empty', async () => {
    // Act / Assert
    await expect(sut.execute('')).rejects.toThrow(InvalidLevelIdException);
    expect(mockScoreRepo.findTopByLevel).not.toHaveBeenCalled();
  });
});
