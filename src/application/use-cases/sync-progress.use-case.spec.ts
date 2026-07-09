import { SyncProgressUseCase } from './sync-progress.use-case';
import type { SyncProgressCommand } from './sync-progress.use-case';
import type { IProgressRepository } from '../ports/i-progress.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import { ProgressEntry } from '../../domain/entities/progress-entry.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';
import { InvalidStarsException } from '../../domain/exceptions/invalid-stars.exception';

describe('SyncProgressUseCase', () => {
  let sut: SyncProgressUseCase;
  let mockProgressRepo: jest.Mocked<IProgressRepository>;
  let mockLogger: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    mockProgressRepo = {
      findAllByUser: jest.fn(),
      findOne: jest.fn(),
      upsert: jest.fn(),
    };
    mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    sut = new SyncProgressUseCase(mockProgressRepo, mockLogger);
  });

  it('should persist a new ProgressEntry as-is when none exists yet', async () => {
    // Arrange
    mockProgressRepo.findOne.mockResolvedValue(null);
    const cmd: SyncProgressCommand = {
      userId: 'user-1',
      levels: [
        { levelId: 'level-1', completed: true, bestScore: 1200, bestStars: 3 },
      ],
    };

    // Act
    const result = await sut.execute(cmd);

    // Assert
    expect(mockProgressRepo.upsert).toHaveBeenCalledTimes(1);
    const saved = mockProgressRepo.upsert.mock.calls[0][0];
    expect(saved).toBeInstanceOf(ProgressEntry);
    expect(saved.completed).toBe(true);
    expect(saved.bestScore?.value).toBe(1200);
    expect(saved.bestStars?.value).toBe(3);
    expect(result).toEqual([saved]);
  });

  it('should persist a completed level without a score as bestScore/bestStars null', async () => {
    // Arrange
    mockProgressRepo.findOne.mockResolvedValue(null);
    const cmd: SyncProgressCommand = {
      userId: 'user-1',
      levels: [{ levelId: 'level-1', completed: true }],
    };

    // Act
    await sut.execute(cmd);

    // Assert
    const saved = mockProgressRepo.upsert.mock.calls[0][0];
    expect(saved.bestScore).toBeNull();
    expect(saved.bestStars).toBeNull();
  });

  it('should never degrade an existing entry: keeps completed=true when incoming is false', async () => {
    // Arrange
    const existing = new ProgressEntry(
      new UserId('user-1'),
      new LevelId('level-1'),
      true,
      new Score(1200),
      new Stars(3),
    );
    mockProgressRepo.findOne.mockResolvedValue(existing);
    const cmd: SyncProgressCommand = {
      userId: 'user-1',
      levels: [{ levelId: 'level-1', completed: false }],
    };

    // Act
    await sut.execute(cmd);

    // Assert
    const saved = mockProgressRepo.upsert.mock.calls[0][0];
    expect(saved.completed).toBe(true);
  });

  it('should keep the higher score/stars between existing and incoming', async () => {
    // Arrange
    const existing = new ProgressEntry(
      new UserId('user-1'),
      new LevelId('level-1'),
      true,
      new Score(1200),
      new Stars(2),
    );
    mockProgressRepo.findOne.mockResolvedValue(existing);
    const cmd: SyncProgressCommand = {
      userId: 'user-1',
      levels: [
        { levelId: 'level-1', completed: true, bestScore: 900, bestStars: 3 },
      ],
    };

    // Act
    await sut.execute(cmd);

    // Assert
    const saved = mockProgressRepo.upsert.mock.calls[0][0];
    expect(saved.bestScore?.value).toBe(1200);
    expect(saved.bestStars?.value).toBe(3);
  });

  it('should sync multiple levels, one upsert per level, and return all merged entries', async () => {
    // Arrange
    mockProgressRepo.findOne.mockResolvedValue(null);
    const cmd: SyncProgressCommand = {
      userId: 'user-1',
      levels: [
        { levelId: 'level-1', completed: true, bestScore: 100, bestStars: 1 },
        { levelId: 'level-2', completed: false },
      ],
    };

    // Act
    const result = await sut.execute(cmd);

    // Assert
    expect(mockProgressRepo.upsert).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it('should throw InvalidStarsException and not persist when bestStars is out of range', async () => {
    // Arrange
    mockProgressRepo.findOne.mockResolvedValue(null);
    const cmd: SyncProgressCommand = {
      userId: 'user-1',
      levels: [
        { levelId: 'level-1', completed: true, bestScore: 100, bestStars: 9 },
      ],
    };

    // Act / Assert
    await expect(sut.execute(cmd)).rejects.toThrow(InvalidStarsException);
    expect(mockProgressRepo.upsert).not.toHaveBeenCalled();
  });
});
