import { ProgressMapper } from './progress.mapper';
import { ProgressEntry } from '../../domain/entities/progress-entry.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { Score } from '../../domain/value-objects/score.vo';
import { Stars } from '../../domain/value-objects/stars.vo';

describe('ProgressMapper', () => {
  it('should flatten a ProgressEntry with score/stars into a plain DTO', () => {
    // Arrange
    const entry = new ProgressEntry(
      new UserId('user-1'),
      new LevelId('level-7'),
      true,
      new Score(1200),
      new Stars(3),
    );

    // Act
    const dto = ProgressMapper.toDto(entry);

    // Assert
    expect(dto).toEqual({
      levelId: 'level-7',
      completed: true,
      bestScore: 1200,
      bestStars: 3,
    });
  });

  it('should map null bestScore/bestStars through as null', () => {
    // Arrange
    const entry = new ProgressEntry(
      new UserId('user-1'),
      new LevelId('level-7'),
      false,
      null,
      null,
    );

    // Act
    const dto = ProgressMapper.toDto(entry);

    // Assert
    expect(dto.bestScore).toBeNull();
    expect(dto.bestStars).toBeNull();
  });
});
