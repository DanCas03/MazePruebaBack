import { SubmitScoreUseCase } from './submit-score.use-case';
import type { SubmitScoreCommand } from './submit-score.use-case';
import type { IScoreRepository } from '../ports/i-score.repository';
import type { ILevelRepository } from '../ports/i-level.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import type { Level } from '../../domain/entities/level.entity';
import { ScoreEntry } from '../../domain/entities/score-entry.entity';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';
import { LevelNotFoundException } from '../../domain/exceptions/level-not-found.exception';
import { DomainException } from '../../domain/exceptions/domain.exception';

describe('SubmitScoreUseCase', () => {
  let sut: SubmitScoreUseCase;
  let mockScoreRepo: jest.Mocked<IScoreRepository>;
  let mockLevelRepo: jest.Mocked<ILevelRepository>;
  let mockLogger: jest.Mocked<ILoggerService>;

  // Nivel liviano: el caso de uso solo lee arrows.length (=optimalMoves) y
  // timeLimitSec del Level cargado; no necesitamos un Level completo.
  const levelFixture = {
    arrows: new Array(10),
    timeLimitSec: 120,
  } as unknown as Level;

  const validCommand: SubmitScoreCommand = {
    userId: 'user-1',
    levelId: 'level-1',
    moves: 12,
    timeSeconds: 45,
    collisions: 0,
    previewScore: 1500,
  };

  const expectedScore = Score.fromRun({
    moves: validCommand.moves,
    optimalMoves: levelFixture.arrows.length,
    collisions: validCommand.collisions,
    timeSeconds: validCommand.timeSeconds,
    timeLimitSec: levelFixture.timeLimitSec,
  });

  const expectedStars = Stars.rate({
    moves: validCommand.moves,
    optimalMoves: levelFixture.arrows.length,
    collisions: validCommand.collisions,
  });

  beforeEach(() => {
    mockScoreRepo = {
      save: jest.fn(),
      findLeaderboard: jest.fn(),
      findGlobalTotals: jest.fn(),
    };
    mockLevelRepo = { findById: jest.fn(), findAllOrdered: jest.fn() };
    mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    mockLevelRepo.findById.mockResolvedValue(levelFixture);
    sut = new SubmitScoreUseCase(mockScoreRepo, mockLevelRepo, mockLogger);
  });

  it('should derive and persist the canonical score/stars from run metrics', async () => {
    // Act
    const result = await sut.execute(validCommand);
    // Assert
    expect(mockScoreRepo.save).toHaveBeenCalledTimes(1);
    const saved = mockScoreRepo.save.mock.calls[0][0];
    expect(saved).toBeInstanceOf(ScoreEntry);
    expect(saved.userId.value).toBe('user-1');
    expect(saved.levelId.value).toBe('level-1');
    expect(saved.score.value).toBe(expectedScore.value);
    expect(saved.stars.value).toBe(expectedStars.value);
    expect(result).toBe(saved);
  });

  it('should reject with LevelNotFoundException and never persist when the level does not exist', async () => {
    // Arrange
    mockLevelRepo.findById.mockResolvedValue(null);
    // Act / Assert
    await expect(sut.execute(validCommand)).rejects.toThrow(
      LevelNotFoundException,
    );
    expect(mockScoreRepo.save).not.toHaveBeenCalled();
  });

  it('should persist the canonical score and log a divergence when previewScore mismatches it', async () => {
    // Arrange
    const command = {
      ...validCommand,
      previewScore: expectedScore.value + 999,
    };
    // Act
    await sut.execute(command);
    // Assert
    const saved = mockScoreRepo.save.mock.calls[0][0];
    expect(saved.score.value).toBe(expectedScore.value);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining(command.userId),
      expect.anything(),
    );
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining(command.levelId),
      expect.anything(),
    );
  });

  it('should not log a divergence when previewScore matches the canonical score', async () => {
    // Arrange
    const command = { ...validCommand, previewScore: expectedScore.value };
    // Act
    await sut.execute(command);
    // Assert
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('should reject with a DomainException and never persist when metrics are invalid', async () => {
    // Arrange
    const command = { ...validCommand, moves: -1 };
    // Act / Assert
    await expect(sut.execute(command)).rejects.toThrow(DomainException);
    expect(mockScoreRepo.save).not.toHaveBeenCalled();
  });
});
