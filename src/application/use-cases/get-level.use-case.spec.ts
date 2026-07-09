import { GetLevelUseCase } from './get-level.use-case';
import type { ILevelRepository } from '../ports/i-level.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { InvalidLevelIdException } from '../../domain/exceptions/invalid-level-id.exception';
import { LevelNotFoundException } from '../../domain/exceptions/level-not-found.exception';

describe('GetLevelUseCase', () => {
  let sut: GetLevelUseCase;
  let mockLevelRepo: jest.Mocked<ILevelRepository>;
  let mockLogger: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    mockLevelRepo = { findById: jest.fn(), findAllOrdered: jest.fn() };
    mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    sut = new GetLevelUseCase(mockLevelRepo, mockLogger);
  });

  it('should return the level produced by the repository', async () => {
    // Arrange
    const level = { id: {} } as any;
    mockLevelRepo.findById.mockResolvedValue(level);
    // Act
    const result = await sut.execute('level-1');
    // Assert
    expect(result).toBe(level);
    expect(mockLevelRepo.findById).toHaveBeenCalledWith(expect.any(LevelId));
    const [idArg] = mockLevelRepo.findById.mock.calls[0];
    expect(idArg.value).toBe('level-1');
  });

  it('should throw LevelNotFoundException when the repository resolves null', async () => {
    // Arrange
    mockLevelRepo.findById.mockResolvedValue(null);
    // Act / Assert
    await expect(sut.execute('level-1')).rejects.toThrow(
      LevelNotFoundException,
    );
  });

  it('should throw InvalidLevelIdException when the level id is empty', async () => {
    // Act / Assert
    await expect(sut.execute('')).rejects.toThrow(InvalidLevelIdException);
    expect(mockLevelRepo.findById).not.toHaveBeenCalled();
  });
});
