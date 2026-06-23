import { Position } from './position.vo';
import { InvalidPositionException } from '../exceptions/invalid-position.exception';

describe('Position', () => {
  describe('constructor', () => {
    it('should create position with valid non-negative row and col', () => {
      const sut = new Position(2, 3);
      expect(sut.row).toBe(2);
      expect(sut.col).toBe(3);
    });

    it('should throw InvalidPositionException when row is negative', () => {
      expect(() => new Position(-1, 0)).toThrow(InvalidPositionException);
    });

    it('should throw InvalidPositionException when col is negative', () => {
      expect(() => new Position(0, -1)).toThrow(InvalidPositionException);
    });

    it('should allow Position(0, 0) — top-left cell is valid', () => {
      expect(() => new Position(0, 0)).not.toThrow();
    });
  });

  describe('equals', () => {
    it('should return true for positions with the same row and col', () => {
      // Arrange
      const a = new Position(1, 2);
      const b = new Position(1, 2);
      // Act / Assert
      expect(a.equals(b)).toBe(true);
    });

    it('should return false when rows differ', () => {
      expect(new Position(1, 2).equals(new Position(2, 2))).toBe(false);
    });
  });
});
