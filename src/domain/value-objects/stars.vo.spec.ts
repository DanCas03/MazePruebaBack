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

  describe('rate', () => {
    it('should return 3 stars when there are 0 collisions and extra moves is 0', () => {
      // Arrange
      const input = { moves: 10, optimalMoves: 10, collisions: 0 };
      // Act
      const sut = Stars.rate(input);
      // Assert
      expect(sut.value).toBe(3);
    });

    it('should return 3 stars when there are 0 collisions and extra moves is 2', () => {
      // Arrange
      const input = { moves: 12, optimalMoves: 10, collisions: 0 };
      // Act
      const sut = Stars.rate(input);
      // Assert
      expect(sut.value).toBe(3);
    });

    it('should return 2 stars when there are 0 collisions and extra moves is 3', () => {
      // Arrange
      const input = { moves: 13, optimalMoves: 10, collisions: 0 };
      // Act
      const sut = Stars.rate(input);
      // Assert
      expect(sut.value).toBe(2);
    });

    it('should return 2 stars when there are 2 collisions and extra moves is 6', () => {
      // Arrange
      const input = { moves: 16, optimalMoves: 10, collisions: 2 };
      // Act
      const sut = Stars.rate(input);
      // Assert
      expect(sut.value).toBe(2);
    });

    it('should return 1 star when there are 3 collisions regardless of extra moves', () => {
      // Arrange
      const input = { moves: 10, optimalMoves: 10, collisions: 3 };
      // Act
      const sut = Stars.rate(input);
      // Assert
      expect(sut.value).toBe(1);
    });

    it('should return 1 star when extra moves is 7', () => {
      // Arrange
      const input = { moves: 17, optimalMoves: 10, collisions: 0 };
      // Act
      const sut = Stars.rate(input);
      // Assert
      expect(sut.value).toBe(1);
    });

    it('should treat moves lower than optimalMoves as extra moves 0', () => {
      // Arrange
      const belowOptimal = { moves: 8, optimalMoves: 10, collisions: 0 };
      const atOptimal = { moves: 10, optimalMoves: 10, collisions: 0 };
      // Act
      const belowOptimalStars = Stars.rate(belowOptimal);
      const atOptimalStars = Stars.rate(atOptimal);
      // Assert
      expect(belowOptimalStars.value).toBe(atOptimalStars.value);
      expect(belowOptimalStars.value).toBe(3);
    });
  });
});
