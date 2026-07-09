import { Stars } from './stars.vo';
import { InvalidStarsException } from '../exceptions/invalid-stars.exception';

describe('Stars', () => {
  describe('constructor', () => {
    it.each([1, 2, 3])(
      'should create Stars with the valid value %i',
      (value) => {
        expect(new Stars(value).value).toBe(value);
      },
    );

    it('should throw InvalidStarsException when value is below the minimum', () => {
      expect(() => new Stars(0)).toThrow(InvalidStarsException);
    });

    it('should throw InvalidStarsException when value is above the maximum', () => {
      expect(() => new Stars(4)).toThrow(InvalidStarsException);
    });

    it('should throw InvalidStarsException when value is not an integer', () => {
      expect(() => new Stars(2.5)).toThrow(InvalidStarsException);
    });
  });

  describe('equals', () => {
    it('should return true when two Stars share the same value', () => {
      expect(new Stars(3).equals(new Stars(3))).toBe(true);
    });

    it('should return false when values differ', () => {
      expect(new Stars(1).equals(new Stars(2))).toBe(false);
    });
  });
});
