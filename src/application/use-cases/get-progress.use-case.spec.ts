import { GetProgressUseCase } from './get-progress.use-case';
import type { IProgressRepository } from '../ports/i-progress.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import { ProgressEntry } from '../../domain/entities/progress-entry.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';
import { InvalidUserIdException } from '../../domain/exceptions/invalid-user-id.exception';

describe('GetProgressUseCase', () => {
  let sut: GetProgressUseCase;
  let mockProgressRepo: jest.Mocked<IProgressRepository>;
  let mockLogger: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    mockProgressRepo = {
      findAllByUser: jest.fn(),
      findOne: jest.fn(),
      upsert: jest.fn(),
    };
    mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    sut = new GetProgressUseCase(mockProgressRepo, mockLogger);
  });

  it("should return the repository's entries for the given user", async () => {
    // Arrange
    const entry = new ProgressEntry(
      new UserId('user-1'),
      new LevelId('level-1'),
      true,
      new Score(1200),
      new Stars(3),
    );
    mockProgressRepo.findAllByUser.mockResolvedValue([entry]);

    // Act
    const result = await sut.execute('user-1');

    // Assert
    expect(mockProgressRepo.findAllByUser).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'user-1' }),
    );
    expect(result).toEqual([entry]);
  });

  it('should throw InvalidUserIdException and not query the repository when userId is empty', async () => {
    // Act / Assert
    await expect(sut.execute('')).rejects.toThrow(InvalidUserIdException);
    expect(mockProgressRepo.findAllByUser).not.toHaveBeenCalled();
  });
});
