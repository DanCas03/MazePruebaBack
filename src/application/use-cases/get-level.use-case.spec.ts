import { GetLevelUseCase } from './get-level.use-case';
import type { ILevelRepository } from '../ports/i-level.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { EmptyCell } from '../../domain/entities/empty-cell.entity';
import { Position } from '../../domain/value-objects/position.vo';
import { LevelNotFoundException } from '../../domain/exceptions/level-not-found.exception';

describe('GetLevelUseCase', () => {
  let sut: GetLevelUseCase;
  let mockRepo: jest.Mocked<ILevelRepository>;
  let mockLogger: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    mockRepo = { findById: jest.fn() };
    mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    sut = new GetLevelUseCase(mockRepo, mockLogger);
  });

  describe('execute', () => {
    it('should return the level grid when the level exists', async () => {
      // Arrange
      const id = new LevelId('level-001');
      const grid = [[new EmptyCell(new Position(0, 0))]];
      mockRepo.findById.mockResolvedValue(grid);
      // Act
      const result = await sut.execute(id);
      // Assert
      expect(result).toBe(grid);
      expect(mockRepo.findById).toHaveBeenCalledWith(id);
      expect(mockLogger.log).toHaveBeenCalledTimes(1);
    });

    it('should throw LevelNotFoundException when the level does not exist', async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null);
      // Act / Assert
      await expect(sut.execute(new LevelId('missing'))).rejects.toThrow(LevelNotFoundException);
      expect(mockLogger.log).not.toHaveBeenCalled();
    });
  });
});
