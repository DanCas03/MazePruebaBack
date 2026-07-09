import { ListLevelsUseCase } from './list-levels.use-case';
import type { ILevelRepository } from '../ports/i-level.repository';
import type { ILoggerService } from '../ports/i-logger.service';

describe('ListLevelsUseCase', () => {
  let sut: ListLevelsUseCase;
  let mockLevelRepo: jest.Mocked<ILevelRepository>;
  let mockLogger: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    mockLevelRepo = { findById: jest.fn(), findAllOrdered: jest.fn() };
    mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    sut = new ListLevelsUseCase(mockLevelRepo, mockLogger);
  });

  it('should return the levels produced by the repository', async () => {
    // Arrange
    const levels = [{ id: {} } as any, { id: {} } as any];
    mockLevelRepo.findAllOrdered.mockResolvedValue(levels);
    // Act
    const result = await sut.execute();
    // Assert
    expect(result).toBe(levels);
  });

  it('should return an empty array without throwing when the repository resolves no levels', async () => {
    // Arrange
    mockLevelRepo.findAllOrdered.mockResolvedValue([]);
    // Act
    const result = await sut.execute();
    // Assert
    expect(result).toEqual([]);
  });
});
