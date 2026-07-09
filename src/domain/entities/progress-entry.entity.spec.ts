import { ProgressEntry } from './progress-entry.entity';
import { UserId } from '../value-objects/user-id.vo';
import { LevelId } from '../value-objects/level-id.vo';
import { Score } from '../value-objects/score.vo';
import { Stars } from '../value-objects/stars.vo';

describe('ProgressEntry', () => {
  it('should compose its fields from the given value objects', () => {
    // Arrange
    const userId = new UserId('user-1');
    const levelId = new LevelId('level-7');
    const bestScore = new Score(1200);
    const bestStars = new Stars(3);

    // Act
    const entry = new ProgressEntry(
      userId,
      levelId,
      true,
      bestScore,
      bestStars,
    );

    // Assert
    expect(entry.userId).toBe(userId);
    expect(entry.levelId).toBe(levelId);
    expect(entry.completed).toBe(true);
    expect(entry.bestScore).toBe(bestScore);
    expect(entry.bestStars).toBe(bestStars);
  });

  it('should allow bestScore and bestStars to be null for a level completed without a submitted score', () => {
    // Arrange / Act
    const entry = new ProgressEntry(
      new UserId('user-1'),
      new LevelId('level-7'),
      true,
      null,
      null,
    );

    // Assert
    expect(entry.bestScore).toBeNull();
    expect(entry.bestStars).toBeNull();
  });
});
