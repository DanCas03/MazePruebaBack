import { ProgressController } from './progress.controller';
import { SyncProgressUseCase } from '../../application/use-cases/sync-progress.use-case';
import { GetProgressUseCase } from '../../application/use-cases/get-progress.use-case';
import { ProgressEntry } from '../../domain/entities/progress-entry.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';
import type { AuthenticatedRequest } from '../http/authenticated-request.interface';
import { InvalidStarsException } from '../../domain/exceptions/invalid-stars.exception';

const buildRequest = (userId: string, email: string): AuthenticatedRequest =>
  ({ user: { userId, email } }) as unknown as AuthenticatedRequest;

describe('ProgressController', () => {
  let sut: ProgressController;
  let mockSyncProgressUseCase: jest.Mocked<
    Pick<SyncProgressUseCase, 'execute'>
  >;
  let mockGetProgressUseCase: jest.Mocked<Pick<GetProgressUseCase, 'execute'>>;

  const buildEntry = () =>
    new ProgressEntry(
      new UserId('user-1'),
      new LevelId('level-7'),
      true,
      new Score(1200),
      new Stars(3),
    );

  beforeEach(() => {
    mockSyncProgressUseCase = { execute: jest.fn() };
    mockGetProgressUseCase = { execute: jest.fn() };
    sut = new ProgressController(
      mockSyncProgressUseCase as unknown as SyncProgressUseCase,
      mockGetProgressUseCase as unknown as GetProgressUseCase,
    );
  });

  describe('syncProgress', () => {
    it('delegates to SyncProgressUseCase with the userId from the request and returns the mapped DTOs', async () => {
      // Arrange
      const dto = {
        levels: [
          {
            levelId: 'level-7',
            completed: true,
            bestScore: 1200,
            bestStars: 3,
          },
        ],
      };
      const req = buildRequest('user-1', 'user@example.com');
      mockSyncProgressUseCase.execute.mockResolvedValue([buildEntry()]);

      // Act
      const result = await sut.syncProgress(dto, req);

      // Assert
      expect(mockSyncProgressUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        levels: dto.levels,
      });
      expect(result).toEqual([
        { levelId: 'level-7', completed: true, bestScore: 1200, bestStars: 3 },
      ]);
    });

    it('propagates InvalidStarsException when the use case throws (surfaced as 400 by the global filter)', async () => {
      // Arrange
      const dto = {
        levels: [{ levelId: 'level-7', completed: true, bestStars: 9 }],
      };
      const req = buildRequest('user-1', 'user@example.com');
      mockSyncProgressUseCase.execute.mockRejectedValue(
        new InvalidStarsException(
          'Stars must be an integer between 1 and 3, got 9',
        ),
      );

      // Act
      const act = () => sut.syncProgress(dto, req);

      // Assert
      await expect(act()).rejects.toBeInstanceOf(InvalidStarsException);
    });
  });

  describe('getProgress', () => {
    it("delegates to GetProgressUseCase with the request's userId and returns mapped entries", async () => {
      // Arrange
      const req = buildRequest('user-1', 'user@example.com');
      mockGetProgressUseCase.execute.mockResolvedValue([buildEntry()]);

      // Act
      const result = await sut.getProgress(req);

      // Assert
      expect(mockGetProgressUseCase.execute).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([
        { levelId: 'level-7', completed: true, bestScore: 1200, bestStars: 3 },
      ]);
    });
  });
});
