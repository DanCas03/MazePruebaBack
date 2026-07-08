import { ScoreController, AuthenticatedRequest } from './score.controller';
import { SubmitScoreUseCase } from '../../application/use-cases/submit-score.use-case';
import { GetLeaderboardUseCase } from '../../application/use-cases/get-leaderboard.use-case';
import { ScoreEntry } from '../../domain/entities/score-entry.entity';
import { ScoreEntryId } from '../../domain/value-objects/score-entry-id.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';
import { MoveCount } from '../../domain/value-objects/move-count.vo';
import { ElapsedTime } from '../../domain/value-objects/elapsed-time.vo';
import { InvalidScoreException } from '../../domain/exceptions/invalid-score.exception';

const buildRequest = (userId: string, email: string): AuthenticatedRequest =>
  ({ user: { userId, email } }) as unknown as AuthenticatedRequest;

describe('ScoreController', () => {
  let sut: ScoreController;
  let mockSubmitScoreUseCase: jest.Mocked<Pick<SubmitScoreUseCase, 'execute'>>;
  let mockGetLeaderboardUseCase: jest.Mocked<
    Pick<GetLeaderboardUseCase, 'execute'>
  >;

  const buildEntry = () =>
    new ScoreEntry(
      new ScoreEntryId('entry-1'),
      new UserId('user-1'),
      new LevelId('level-7'),
      new Score(1200),
      new Stars(3),
      new MoveCount(12),
      new ElapsedTime(45),
      new Date('2026-07-08T12:00:00.000Z'),
    );

  beforeEach(() => {
    mockSubmitScoreUseCase = { execute: jest.fn() };
    mockGetLeaderboardUseCase = { execute: jest.fn() };
    sut = new ScoreController(
      mockSubmitScoreUseCase as unknown as SubmitScoreUseCase,
      mockGetLeaderboardUseCase as unknown as GetLeaderboardUseCase,
    );
  });

  describe('submitScore', () => {
    it('delegates to SubmitScoreUseCase with the userId from the request and returns the mapped DTO', async () => {
      // Arrange
      const dto = {
        levelId: 'level-7',
        score: 1200,
        stars: 3,
        moves: 12,
        timeSeconds: 45,
      };
      const req = buildRequest('user-1', 'user@example.com');
      mockSubmitScoreUseCase.execute.mockResolvedValue(buildEntry());

      // Act
      const result = await sut.submitScore(dto, req);

      // Assert
      expect(mockSubmitScoreUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        levelId: 'level-7',
        score: 1200,
        stars: 3,
        moves: 12,
        timeSeconds: 45,
      });
      expect(result).toEqual({
        id: 'entry-1',
        userId: 'user-1',
        levelId: 'level-7',
        score: 1200,
        stars: 3,
        moves: 12,
        timeSeconds: 45,
        createdAt: '2026-07-08T12:00:00.000Z',
      });
    });

    it('propagates InvalidScoreException when the use case throws (surfaced as 400 by the global filter)', async () => {
      // Arrange
      const dto = {
        levelId: 'level-7',
        score: -1,
        stars: 3,
        moves: 12,
        timeSeconds: 45,
      };
      const req = buildRequest('user-1', 'user@example.com');
      mockSubmitScoreUseCase.execute.mockRejectedValue(
        new InvalidScoreException(
          'Score must be a non-negative integer, got -1',
        ),
      );

      // Act
      const act = () => sut.submitScore(dto, req);

      // Assert
      await expect(act()).rejects.toBeInstanceOf(InvalidScoreException);
    });
  });

  describe('getLeaderboard', () => {
    it('delegates to GetLeaderboardUseCase with the levelId param and parsed limit, and returns mapped entries', async () => {
      // Arrange
      mockGetLeaderboardUseCase.execute.mockResolvedValue([buildEntry()]);

      // Act
      const result = await sut.getLeaderboard('level-7', '5');

      // Assert
      expect(mockGetLeaderboardUseCase.execute).toHaveBeenCalledWith(
        'level-7',
        5,
      );
      expect(result).toEqual([
        {
          id: 'entry-1',
          userId: 'user-1',
          levelId: 'level-7',
          score: 1200,
          stars: 3,
          moves: 12,
          timeSeconds: 45,
          createdAt: '2026-07-08T12:00:00.000Z',
        },
      ]);
    });

    it('passes undefined limit through to the use case when no query param is given', async () => {
      // Arrange
      mockGetLeaderboardUseCase.execute.mockResolvedValue([]);

      // Act
      await sut.getLeaderboard('level-7', undefined);

      // Assert
      expect(mockGetLeaderboardUseCase.execute).toHaveBeenCalledWith(
        'level-7',
        undefined,
      );
    });
  });
});
