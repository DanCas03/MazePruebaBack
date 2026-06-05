import { Direction, DirectionValue } from './direction.vo';
import { InvalidDirectionException } from '../exceptions/invalid-direction.exception';

describe('Direction (Value Object)', () => {
  it('rotateClockwise recorre el ciclo y vuelve al origen tras 4 giros', () => {
    // Arrange
    const start = Direction.of('UP');

    // Act
    const afterFour = start
      .rotateClockwise()
      .rotateClockwise()
      .rotateClockwise()
      .rotateClockwise();

    // Assert
    expect(start.rotateClockwise().value).toBe(DirectionValue.RIGHT);
    expect(afterFour.value).toBe(DirectionValue.UP);
  });

  it('of acepta valores en cualquier capitalización', () => {
    expect(Direction.of('down').value).toBe(DirectionValue.DOWN);
  });

  it('of lanza InvalidDirectionException para valores no reconocidos', () => {
    expect(() => Direction.of('diagonal')).toThrow(InvalidDirectionException);
  });
});
