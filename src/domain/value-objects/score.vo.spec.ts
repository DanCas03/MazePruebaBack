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

  describe('fromRun', () => {
    it('should return 10000 when the run is a perfect instant solve', () => {
      // Arrange
      const input = {
        moves: 20,
        optimalMoves: 20,
        collisions: 0,
        timeSeconds: 0,
        timeLimitSec: 120,
      };
      // Act
      const sut = Score.fromRun(input);
      // Assert
      expect(sut.value).toBe(10000);
    });

    it('should return 5000 when timeSeconds equals exactly half the time limit (par)', () => {
      // Arrange
      const input = {
        moves: 20,
        optimalMoves: 20,
        collisions: 0,
        timeSeconds: 60,
        timeLimitSec: 120,
      };
      // Act
      const sut = Score.fromRun(input);
      // Assert
      expect(sut.value).toBe(5000);
    });

    it('should return 2500 when timeSeconds equals the full time limit', () => {
      // Arrange
      const input = {
        moves: 20,
        optimalMoves: 20,
        collisions: 0,
        timeSeconds: 120,
        timeLimitSec: 120,
      };
      // Act
      const sut = Score.fromRun(input);
      // Assert
      expect(sut.value).toBe(2500);
    });

    it('should return 2500 when moves double the optimalMoves', () => {
      // Arrange
      const input = {
        moves: 20,
        optimalMoves: 10,
        collisions: 0,
        timeSeconds: 0,
        timeLimitSec: 120,
      };
      // Act
      const sut = Score.fromRun(input);
      // Assert
      expect(sut.value).toBe(2500);
    });

    it('should return 8000 when there is exactly 1 collision and the run is otherwise perfect', () => {
      // Arrange
      const input = {
        moves: 20,
        optimalMoves: 20,
        collisions: 1,
        timeSeconds: 0,
        timeLimitSec: 120,
      };
      // Act
      const sut = Score.fromRun(input);
      // Assert
      expect(sut.value).toBe(8000);
    });

    it('should return 114 for a disastrous run (3x moves, 4 collisions, timeSeconds = timeLimitSec)', () => {
      // Arrange
      // NOTE: per the authoritative formula, this parameter combination does NOT
      // reach the floor of 100 (it computes to 113.78 -> rounds to 114). See
      // the dedicated floor-clamp test below for a combination that does hit 100.
      const input = {
        moves: 30,
        optimalMoves: 10,
        collisions: 4,
        timeSeconds: 120,
        timeLimitSec: 120,
      };
      // Act
      const sut = Score.fromRun(input);
      // Assert
      expect(sut.value).toBe(114);
    });

    it('should clamp to the floor of 100 when the computed score would fall below it', () => {
      // Arrange
      const input = {
        moves: 100,
        optimalMoves: 10,
        collisions: 10,
        timeSeconds: 600,
        timeLimitSec: 120,
      };
      // Act
      const sut = Score.fromRun(input);
      // Assert
      expect(sut.value).toBe(100);
    });

    it('should give no extra credit when moves is lower than optimalMoves', () => {
      // Arrange
      const belowOptimal = {
        moves: 15,
        optimalMoves: 20,
        collisions: 1,
        timeSeconds: 0,
        timeLimitSec: 120,
      };
      const atOptimal = {
        moves: 20,
        optimalMoves: 20,
        collisions: 1,
        timeSeconds: 0,
        timeLimitSec: 120,
      };
      // Act
      const belowOptimalScore = Score.fromRun(belowOptimal);
      const atOptimalScore = Score.fromRun(atOptimal);
      // Assert
      expect(belowOptimalScore.value).toBe(atOptimalScore.value);
    });

    it('should not divide by zero when optimalMoves is 0 (degenerate level)', () => {
      // Arrange
      const input = {
        moves: 0,
        optimalMoves: 0,
        collisions: 0,
        timeSeconds: 0,
        timeLimitSec: 120,
      };
      // Act
      const sut = Score.fromRun(input);
      // Assert
      expect(sut.value).toBe(10000);
    });

    it.each([
      { moves: 20, optimalMoves: 20, collisions: 0, timeSeconds: 0, timeLimitSec: 120 },
      { moves: 45, optimalMoves: 10, collisions: 3, timeSeconds: 200, timeLimitSec: 90 },
      { moves: 10, optimalMoves: 10, collisions: 2, timeSeconds: 999, timeLimitSec: 60 },
      { moves: 5, optimalMoves: 5, collisions: 0, timeSeconds: 30, timeLimitSec: 60 },
    ])(
      'should always return an integer between 100 and 10000 for input %j',
      (input) => {
        // Arrange
        // (input provided by the parametrized case)
        // Act
        const sut = Score.fromRun(input);
        // Assert
        expect(Number.isInteger(sut.value)).toBe(true);
        expect(sut.value).toBeGreaterThanOrEqual(100);
        expect(sut.value).toBeLessThanOrEqual(10000);
      },
    );
  });
});
