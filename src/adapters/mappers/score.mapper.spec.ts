import { ScoreMapper } from './score.mapper';
import { ScoreEntry } from '../../domain/entities/score-entry.entity';
import { ScoreEntryId } from '../../domain/value-objects/score-entry-id.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';
import { MoveCount } from '../../domain/value-objects/move-count.vo';
import { ElapsedTime } from '../../domain/value-objects/elapsed-time.vo';
import type { LeaderboardRow } from '../../application/read-models/leaderboard-row';

describe('ScoreMapper', () => {
  it('flattens a ScoreEntry into its plain DTO shape', () => {
    // Arrange
    const createdAt = new Date('2026-07-08T12:00:00.000Z');
    const entry = new ScoreEntry(
      new ScoreEntryId('entry-1'),
      new UserId('user-1'),
      new LevelId('level-7'),
      new Score(1200),
      new Stars(3),
      new MoveCount(12),
      new ElapsedTime(45),
      createdAt,
    );

    // Act
    const dto = ScoreMapper.toDto(entry);

    // Assert
    expect(dto).toEqual({
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

  it('flattens a LeaderboardRow into its DTO with username', () => {
    // Arrange
    const row: LeaderboardRow = {
      id: 'entry-1',
      userId: 'user-1',
      username: 'ana',
      levelId: 'level-7',
      score: 1200,
      stars: 3,
      moves: 12,
      timeSeconds: 45,
      createdAt: new Date('2026-07-08T12:00:00.000Z'),
    };

    // Act
    const dto = ScoreMapper.leaderboardRowToDto(row);

    // Assert
    expect(dto).toEqual({
      id: 'entry-1',
      userId: 'user-1',
      username: 'ana',
      levelId: 'level-7',
      score: 1200,
      stars: 3,
      moves: 12,
      timeSeconds: 45,
      createdAt: '2026-07-08T12:00:00.000Z',
    });
  });
});
