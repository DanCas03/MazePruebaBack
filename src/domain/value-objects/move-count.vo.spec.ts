import { MoveCount } from './move-count.vo';
import { InvalidMoveCountException } from '../exceptions/invalid-move-count.exception';

describe('MoveCount', () => {
  describe('constructor', () => {
    it('should create a MoveCount with a valid positive integer', () => {
      expect(new MoveCount(7).value).toBe(7);
    });

    it('should allow a MoveCount of 0', () => {
      expect(() => new MoveCount(0)).not.toThrow();
    });

    it('should throw InvalidMoveCountException when value is negative', () => {
      expect(() => new MoveCount(-1)).toThrow(InvalidMoveCountException);
    });

    it('should throw InvalidMoveCountException when value is not an integer', () => {
      expect(() => new MoveCount(3.14)).toThrow(InvalidMoveCountException);
    });
  });

  describe('equals', () => {
    it('should return true when two MoveCounts share the same value', () => {
      expect(new MoveCount(5).equals(new MoveCount(5))).toBe(true);
    });

    it('should return false when values differ', () => {
      expect(new MoveCount(5).equals(new MoveCount(6))).toBe(false);
    });
  });
});
