import { Score } from './score.vo';
import { InvalidScoreException } from '../exceptions/invalid-score.exception';

describe('Score', () => {
  describe('constructor', () => {
    it('should create a Score with a valid positive integer', () => {
      const sut = new Score(1500);
      expect(sut.value).toBe(1500);
    });

    it('should allow a Score of 0 as the worst valid result', () => {
      expect(() => new Score(0)).not.toThrow();
    });

    it('should throw InvalidScoreException when value is negative', () => {
      expect(() => new Score(-1)).toThrow(InvalidScoreException);
    });

    it('should throw InvalidScoreException when value is not an integer', () => {
      expect(() => new Score(12.5)).toThrow(InvalidScoreException);
    });
  });

  describe('equals', () => {
    it('should return true when two Scores share the same value', () => {
      expect(new Score(100).equals(new Score(100))).toBe(true);
    });

    it('should return false when values differ', () => {
      expect(new Score(100).equals(new Score(200))).toBe(false);
    });
  });
});
