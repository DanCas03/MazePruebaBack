import { ArrowId } from './arrow-id.vo';
import { InvalidArrowIdException } from '../exceptions/invalid-arrow-id.exception';

describe('ArrowId', () => {
  describe('constructor', () => {
    it('should create arrow id and expose value when string is non-empty', () => {
      const sut = new ArrowId('a1');
      expect(sut.value).toBe('a1');
    });

    it('should throw InvalidArrowIdException when value is an empty string', () => {
      expect(() => new ArrowId('')).toThrow(InvalidArrowIdException);
    });

    it('should throw InvalidArrowIdException when value is whitespace only', () => {
      expect(() => new ArrowId('   ')).toThrow(InvalidArrowIdException);
    });
  });

  describe('equals', () => {
    it('should return true when both ids hold the same value', () => {
      // Arrange
      const a = new ArrowId('a1');
      const b = new ArrowId('a1');
      // Act / Assert
      expect(a.equals(b)).toBe(true);
    });

    it('should return false when values differ', () => {
      expect(new ArrowId('a1').equals(new ArrowId('a2'))).toBe(false);
    });
  });
});
