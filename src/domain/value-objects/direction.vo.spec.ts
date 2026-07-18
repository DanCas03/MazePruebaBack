import { Direction } from './direction.vo';

describe('Direction', () => {
  it('should expose exactly eight directions', () => {
    // Act
    const values = Object.values(Direction);
    // Assert
    expect(values).toHaveLength(8);
  });

  it('should use camelCase wire values matching ADR-0007', () => {
    // Assert — el valor wire es camelCase idéntico al nombre del literal.
    expect(Direction.UP).toBe('up');
    expect(Direction.DOWN).toBe('down');
    expect(Direction.LEFT).toBe('left');
    expect(Direction.RIGHT).toBe('right');
    expect(Direction.UP_LEFT).toBe('upLeft');
    expect(Direction.UP_RIGHT).toBe('upRight');
    expect(Direction.DOWN_LEFT).toBe('downLeft');
    expect(Direction.DOWN_RIGHT).toBe('downRight');
  });
});
