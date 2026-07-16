import { ScoreController, AuthenticatedRequest } from './score.controller';
import { SubmitScoreUseCase } from '../../application/use-cases/submit-score.use-case';
import { GetLeaderboardUseCase } from '../../application/use-cases/get-leaderboard.use-case';
import { GetGlobalLeaderboardUseCase } from '../../application/use-cases/get-global-leaderboard.use-case';
import { ScoreEntry } from '../../domain/entities/score-entry.entity';
import { ScoreEntryId } from '../../domain/value-objects/score-entry-id.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';
import { MoveCount } from '../../domain/value-objects/move-count.vo';
import { ElapsedTime } from '../../domain/value-objects/elapsed-time.vo';
import { InvalidScoreException } from '../../domain/exceptions/invalid-score.exception';
import type { LeaderboardRow } from '../../application/read-models/leaderboard-row';
import type { GlobalLeaderboard } from '../../application/read-models/global-leaderboard';

const buildRequest = (userId: string, email: string): AuthenticatedRequest =>
  ({ user: { userId, email } }) as unknown as AuthenticatedRequest;

describe('ScoreController', () => {
  let sut: ScoreController;
  let mockSubmitScoreUseCase: jest.Mocked<Pick<SubmitScoreUseCase, 'execute'>>;
  let mockGetLeaderboardUseCase: jest.Mocked<
    Pick<GetLeaderboardUseCase, 'execute'>
  >;
  let mockGetGlobalLeaderboardUseCase: jest.Mocked<
    Pick<GetGlobalLeaderboardUseCase, 'execute'>
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

  const buildRow = (over: Partial<LeaderboardRow> = {}): LeaderboardRow => ({
    id: 'entry-1',
    userId: 'user-1',
    username: 'ana',
    levelId: 'level-7',
    score: 1200,
    stars: 3,
    moves: 12,
    timeSeconds: 45,
    createdAt: new Date('2026-07-08T12:00:00.000Z'),
    ...over,
  });

  beforeEach(() => {
    mockSubmitScoreUseCase = { execute: jest.fn() };
    mockGetLeaderboardUseCase = { execute: jest.fn() };
    mockGetGlobalLeaderboardUseCase = { execute: jest.fn() };
    sut = new ScoreController(
      mockSubmitScoreUseCase as unknown as SubmitScoreUseCase,
      mockGetLeaderboardUseCase as unknown as GetLeaderboardUseCase,
      mockGetGlobalLeaderboardUseCase as unknown as GetGlobalLeaderboardUseCase,
    );
  });

  describe('submitScore', () => {
    it('delegates to SubmitScoreUseCase with the run metrics and returns the canonical score/stars', async () => {
      // Arrange
      const dto = {
        levelId: 'level-7',
        moves: 12,
        timeSeconds: 45,
        collisions: 1,
        previewScore: 5240,
      };
      const req = buildRequest('user-1', 'user@example.com');
      mockSubmitScoreUseCase.execute.mockResolvedValue(buildEntry());

      // Act
      const result = await sut.submitScore(dto, req);

      // Assert
      expect(mockSubmitScoreUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        levelId: 'level-7',
        moves: 12,
        timeSeconds: 45,
        collisions: 1,
        previewScore: 5240,
      });
      expect(result).toEqual({
        score: 1200,
        stars: 3,
      });
    });

    it('propagates InvalidScoreException when the use case throws (surfaced as 400 by the global filter)', async () => {
      // Arrange
      const dto = {
        levelId: 'level-7',
        moves: 12,
        timeSeconds: 45,
        collisions: 1,
        previewScore: 5240,
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
    it('delegates to GetLeaderboardUseCase with the levelId param and parsed limit, and returns mapped rows with username', async () => {
      // Arrange
      mockGetLeaderboardUseCase.execute.mockResolvedValue([buildRow()]);

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
          username: 'ana',
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

  describe('getGlobalLeaderboard', () => {
    const buildLeaderboard = (): GlobalLeaderboard => ({
      top: [
        {
          userId: 'user-1',
          username: 'ana',
          totalScore: 900,
          totalStars: 12,
          rank: 1,
        },
      ],
      me: {
        userId: 'user-1',
        username: 'ana',
        totalScore: 900,
        totalStars: 12,
        rank: 1,
      },
    });

    it('delegates to GetGlobalLeaderboardUseCase with the requesting userId and parsed limit, returning the result as-is', async () => {
      // Arrange
      const req = buildRequest('user-1', 'user@example.com');
      const leaderboard = buildLeaderboard();
      mockGetGlobalLeaderboardUseCase.execute.mockResolvedValue(leaderboard);

      // Act
      const result = await sut.getGlobalLeaderboard(req, '10');

      // Assert
      expect(mockGetGlobalLeaderboardUseCase.execute).toHaveBeenCalledWith(
        'user-1',
        10,
      );
      expect(result).toBe(leaderboard);
    });

    it('passes undefined limit through to the use case when no query param is given', async () => {
      // Arrange
      const req = buildRequest('user-1', 'user@example.com');
      mockGetGlobalLeaderboardUseCase.execute.mockResolvedValue({
        top: [],
        me: null,
      });

      // Act
      await sut.getGlobalLeaderboard(req, undefined);

      // Assert
      expect(mockGetGlobalLeaderboardUseCase.execute).toHaveBeenCalledWith(
        'user-1',
        undefined,
      );
    });

    it('coexists with GET /leaderboard/:levelId as a distinct route (both use cases independently invokable)', async () => {
      // Arrange
      const req = buildRequest('user-1', 'user@example.com');
      mockGetGlobalLeaderboardUseCase.execute.mockResolvedValue(
        buildLeaderboard(),
      );
      mockGetLeaderboardUseCase.execute.mockResolvedValue([buildRow()]);

      // Act
      await sut.getGlobalLeaderboard(req, undefined);
      await sut.getLeaderboard('level-7', undefined);

      // Assert
      expect(mockGetGlobalLeaderboardUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockGetLeaderboardUseCase.execute).toHaveBeenCalledWith(
        'level-7',
        undefined,
      );
    });
  });
});
