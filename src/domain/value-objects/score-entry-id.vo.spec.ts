import { ScoreEntryId } from './score-entry-id.vo';
import { InvalidScoreEntryIdException } from '../exceptions/invalid-score-entry-id.exception';

describe('ScoreEntryId', () => {
  describe('constructor', () => {
    it('should create a ScoreEntryId with a non-empty string', () => {
      expect(new ScoreEntryId('score-1').value).toBe('score-1');
    });

    it('should throw InvalidScoreEntryIdException when value is empty', () => {
      expect(() => new ScoreEntryId('')).toThrow(InvalidScoreEntryIdException);
    });

    it('should throw InvalidScoreEntryIdException when value is only whitespace', () => {
      expect(() => new ScoreEntryId('   ')).toThrow(
        InvalidScoreEntryIdException,
      );
    });
  });

  describe('equals', () => {
    it('should return true when two ids share the same value', () => {
      expect(new ScoreEntryId('a').equals(new ScoreEntryId('a'))).toBe(true);
    });

    it('should return false when values differ', () => {
      expect(new ScoreEntryId('a').equals(new ScoreEntryId('b'))).toBe(false);
    });
  });
});
