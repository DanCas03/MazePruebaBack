import { ScoreEntry } from './score-entry.entity';
import { ScoreEntryId } from '../value-objects/score-entry-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { LevelId } from '../value-objects/level-id.vo';
import { Score } from '../value-objects/score.vo';
import { Stars } from '../value-objects/stars.vo';
import { MoveCount } from '../value-objects/move-count.vo';
import { ElapsedTime } from '../value-objects/elapsed-time.vo';

describe('ScoreEntry', () => {
  it('should compose the value objects it is constructed with', () => {
    // Arrange
    const createdAt = new Date('2026-07-08T00:00:00Z');
    // Act
    const sut = new ScoreEntry(
      new ScoreEntryId('score-1'),
      new UserId('user-1'),
      new LevelId('level-1'),
      new Score(1500),
      new Stars(3),
      new MoveCount(12),
      new ElapsedTime(45),
      createdAt,
    );
    // Assert
    expect(sut.id.value).toBe('score-1');
    expect(sut.userId.value).toBe('user-1');
    expect(sut.levelId.value).toBe('level-1');
    expect(sut.score.value).toBe(1500);
    expect(sut.stars.value).toBe(3);
    expect(sut.moves.value).toBe(12);
    expect(sut.time.seconds).toBe(45);
    expect(sut.createdAt).toBe(createdAt);
  });
});
