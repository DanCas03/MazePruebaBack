import { ElapsedTime } from './elapsed-time.vo';
import { InvalidElapsedTimeException } from '../exceptions/invalid-elapsed-time.exception';

describe('ElapsedTime', () => {
  describe('constructor', () => {
    it('should create an ElapsedTime with a valid positive number of seconds', () => {
      expect(new ElapsedTime(42).seconds).toBe(42);
    });

    it('should allow an ElapsedTime of 0 seconds', () => {
      expect(() => new ElapsedTime(0)).not.toThrow();
    });

    it('should throw InvalidElapsedTimeException when seconds is negative', () => {
      expect(() => new ElapsedTime(-1)).toThrow(InvalidElapsedTimeException);
    });

    it('should throw InvalidElapsedTimeException when seconds is not an integer', () => {
      expect(() => new ElapsedTime(1.5)).toThrow(InvalidElapsedTimeException);
    });
  });

  describe('equals', () => {
    it('should return true when two ElapsedTimes share the same seconds', () => {
      expect(new ElapsedTime(60).equals(new ElapsedTime(60))).toBe(true);
    });

    it('should return false when seconds differ', () => {
      expect(new ElapsedTime(60).equals(new ElapsedTime(61))).toBe(false);
    });
  });
});
