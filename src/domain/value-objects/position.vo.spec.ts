import { Position } from './position.vo';
import { InvalidPositionException } from '../exceptions/invalid-position.exception';

describe('Position (Value Object)', () => {
  it('dos posiciones con las mismas coordenadas son iguales (igualdad por valor)', () => {
    // Arrange
    const a = Position.of(1, 2);
    const b = Position.of(1, 2);

    // Act
    const result = a.equals(b);

    // Assert
    expect(result).toBe(true);
  });

  it('rechaza coordenadas negativas lanzando InvalidPositionException', () => {
    // Arrange / Act / Assert
    expect(() => Position.of(-1, 0)).toThrow(InvalidPositionException);
  });

  it('rechaza coordenadas no enteras', () => {
    expect(() => Position.of(1.5, 0)).toThrow(InvalidPositionException);
  });
});
