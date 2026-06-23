import { LevelId } from './level-id.vo';
import { InvalidLevelIdException } from '../exceptions/invalid-level-id.exception';

describe('LevelId', () => {
  it('should create with a non-empty string', () => {
    const sut = new LevelId('level-abc');
    expect(sut.value).toBe('level-abc');
  });

  it('should throw InvalidLevelIdException for empty string', () => {
    expect(() => new LevelId('')).toThrow(InvalidLevelIdException);
  });

  it('should throw InvalidLevelIdException for whitespace-only string', () => {
    expect(() => new LevelId('   ')).toThrow(InvalidLevelIdException);
  });

  it('equals returns true for the same value', () => {
    expect(new LevelId('x').equals(new LevelId('x'))).toBe(true);
  });

  it('equals returns false for different values', () => {
    expect(new LevelId('a').equals(new LevelId('b'))).toBe(false);
  });
});
