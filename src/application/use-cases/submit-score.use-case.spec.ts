import { SubmitScoreUseCase } from './submit-score.use-case';
import type { SubmitScoreCommand } from './submit-score.use-case';
import type { IScoreRepository } from '../ports/i-score.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import { ScoreEntry } from '../../domain/entities/score-entry.entity';
import { InvalidStarsException } from '../../domain/exceptions/invalid-stars.exception';

describe('SubmitScoreUseCase', () => {
  let sut: SubmitScoreUseCase;
  let mockScoreRepo: jest.Mocked<IScoreRepository>;
  let mockLogger: jest.Mocked<ILoggerService>;

  const validCommand: SubmitScoreCommand = {
    userId: 'user-1',
    levelId: 'level-1',
    score: 1500,
    stars: 3,
    moves: 12,
    timeSeconds: 45,
  };

  beforeEach(() => {
    mockScoreRepo = { save: jest.fn(), findTopByLevel: jest.fn() };
    mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    sut = new SubmitScoreUseCase(mockScoreRepo, mockLogger);
  });

  it('should persist a ScoreEntry built from the command when input is valid', async () => {
    // Act
    const result = await sut.execute(validCommand);
    // Assert
    expect(mockScoreRepo.save).toHaveBeenCalledTimes(1);
    const saved = mockScoreRepo.save.mock.calls[0][0];
    expect(saved).toBeInstanceOf(ScoreEntry);
    expect(saved.userId.value).toBe('user-1');
    expect(saved.levelId.value).toBe('level-1');
    expect(saved.score.value).toBe(1500);
    expect(saved.stars.value).toBe(3);
    expect(result).toBe(saved);
  });

  it('should throw InvalidStarsException and not persist when stars is out of range', async () => {
    // Arrange
    const command = { ...validCommand, stars: 4 };
    // Act / Assert
    await expect(sut.execute(command)).rejects.toThrow(InvalidStarsException);
    expect(mockScoreRepo.save).not.toHaveBeenCalled();
  });
});
