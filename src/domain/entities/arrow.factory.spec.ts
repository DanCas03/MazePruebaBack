import { ArrowFactory } from './arrow.factory';
import { Arrow } from './arrow.entity';
import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { InvalidDirectionException } from '../exceptions/invalid-direction.exception';
import { InvalidArrowIdException } from '../exceptions/invalid-arrow-id.exception';
import { InvalidArrowException } from '../exceptions/invalid-arrow.exception';
import { InvalidPositionException } from '../exceptions/invalid-position.exception';

// Forma cruda del arrow-path tal como llega por el wire (CONTEXT-MAP.md).
type RawArrow = { id: string; headDir: string; cells: number[][] };

describe('ArrowFactory', () => {
  // Helper: raw válido por defecto, con overrides puntuales por caso.
  const rawOf = (overrides: Partial<RawArrow> = {}): RawArrow => ({
    id: 'a1',
    headDir: 'up',
    cells: [[0, 0]],
    ...overrides,
  });

  describe('create', () => {
    it('should build an Arrow preserving cell order when raw matches the wire contract example', () => {
      // Arrange
      const raw = rawOf({
        id: 'a1',
        headDir: 'up',
        cells: [
          [10, 3],
          [9, 3],
          [9, 4],
        ],
      });
      // Act
      const sut = ArrowFactory.create(raw);
      // Assert
      expect(sut).toBeInstanceOf(Arrow);
      expect(sut.id.value).toBe('a1');
      expect(sut.headDir).toBe(Direction.UP);
      expect(sut.cells).toEqual([
        new Position(10, 3),
        new Position(9, 3),
        new Position(9, 4),
      ]);
    });

    it.each([
      ['UP', Direction.UP],
      ['Right', Direction.RIGHT],
      ['dOwN', Direction.DOWN],
      ['upLeft', Direction.UP_LEFT],
      ['UPLEFT', Direction.UP_LEFT],
      ['downright', Direction.DOWN_RIGHT],
      ['upRight', Direction.UP_RIGHT],
      ['downLeft', Direction.DOWN_LEFT],
    ])(
      'should parse headDir case-insensitively when the wire value is %s',
      (headDir, expected) => {
        // Arrange
        const raw = rawOf({ headDir });
        // Act
        const sut = ArrowFactory.create(raw);
        // Assert
        expect(sut.headDir).toBe(expected);
      },
    );

    it('should throw InvalidDirectionException when headDir is not a recognized direction', () => {
      // Arrange
      const raw = rawOf({ headDir: 'diagonal' });
      // Act / Assert
      expect(() => ArrowFactory.create(raw)).toThrow(InvalidDirectionException);
    });

    it('should throw InvalidDirectionException when headDir is empty', () => {
      // Arrange
      const raw = rawOf({ headDir: '' });
      // Act / Assert
      expect(() => ArrowFactory.create(raw)).toThrow(InvalidDirectionException);
    });

    it('should throw InvalidArrowIdException when id is empty', () => {
      // Arrange
      const raw = rawOf({ id: '' });
      // Act / Assert
      expect(() => ArrowFactory.create(raw)).toThrow(InvalidArrowIdException);
    });

    it('should throw InvalidArrowException when a cell has fewer than two coordinates', () => {
      // Arrange
      const raw = rawOf({ cells: [[1]] });
      // Act / Assert
      expect(() => ArrowFactory.create(raw)).toThrow(InvalidArrowException);
    });

    it('should throw InvalidArrowException when a cell has more than two coordinates', () => {
      // Arrange
      const raw = rawOf({ cells: [[1, 2, 3]] });
      // Act / Assert
      expect(() => ArrowFactory.create(raw)).toThrow(InvalidArrowException);
    });

    it('should throw InvalidArrowException when a coordinate is not an integer', () => {
      // Arrange
      const raw = rawOf({ cells: [[1.5, 2]] });
      // Act / Assert
      expect(() => ArrowFactory.create(raw)).toThrow(InvalidArrowException);
    });

    it('should throw InvalidPositionException when a coordinate is negative', () => {
      // Arrange
      const raw = rawOf({ cells: [[-1, 0]] });
      // Act / Assert
      expect(() => ArrowFactory.create(raw)).toThrow(InvalidPositionException);
    });

    it('should throw InvalidArrowException when cells is empty', () => {
      // Arrange
      const raw = rawOf({ cells: [] });
      // Act / Assert
      expect(() => ArrowFactory.create(raw)).toThrow(InvalidArrowException);
    });

    it('should throw InvalidArrowException when a cell is repeated in the path', () => {
      // Arrange
      const raw = rawOf({
        cells: [
          [0, 0],
          [0, 1],
          [0, 0],
        ],
      });
      // Act / Assert
      expect(() => ArrowFactory.create(raw)).toThrow(InvalidArrowException);
    });

    it('should build an Arrow when consecutive cells are not orthogonally adjacent — adjacency is validated by Level (ADR 0005)', () => {
      // La adyacencia es geometría del espacio y la valida Level vía
      // BoardSpace, no la frontera de primitivos: la factory solo parsea la
      // forma del wire y entrega un Arrow como dato puro.
      // Arrange
      const raw = rawOf({
        cells: [
          [0, 0],
          [0, 2],
        ],
      });
      // Act
      const sut = ArrowFactory.create(raw);
      // Assert
      expect(sut).toBeInstanceOf(Arrow);
      expect(sut.cells).toEqual([new Position(0, 0), new Position(0, 2)]);
    });
  });
});
