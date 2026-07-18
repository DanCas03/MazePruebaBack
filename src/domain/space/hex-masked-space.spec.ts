import { HexMaskedSpace } from './hex-masked-space';
import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { InvalidBoardSpaceException } from '../exceptions/invalid-board-space.exception';

// HexMaskedSpace (ADR-0007 D5, back#59): hex de radio R restringido a un set
// de celdas ACTIVAS — espejo deliberado de HoledRectSpace (que resta agujeros)
// pero en positivo, como fija el brief. NO decorador: la generalización es
// deuda registrada. Toda celda fuera del set es FRONTERA.
describe('HexMaskedSpace', () => {
  // SUT: R=1 con la fila central activa — (1,0), (1,1), (1,2).
  const activeRow = [
    new Position(1, 0),
    new Position(1, 1),
    new Position(1, 2),
  ];

  it('should contain only the active cells', () => {
    // Arrange
    const sut = new HexMaskedSpace(1, activeRow);
    // Act / Assert — (0,1) pertenece al hex base pero no a la máscara.
    expect(sut.contains(new Position(1, 1))).toBe(true);
    expect(sut.contains(new Position(0, 1))).toBe(false);
    expect(sut.contains(new Position(0, 0))).toBe(false); // fuera del hex base
  });

  it('should inherit a coherent cellCount and allCells from the mask', () => {
    // Arrange
    const sut = new HexMaskedSpace(1, activeRow);
    // Act
    const cells = Array.from(sut.allCells()).map((c) => [c.row, c.col]);
    // Assert
    expect(sut.cellCount).toBe(3);
    expect(cells).toEqual([
      [1, 0],
      [1, 1],
      [1, 2],
    ]);
  });

  it('should cut the exit lane at the mask frontier', () => {
    // Arrange — up desde (1,1) sale de la máscara aunque (0,1) sea hex válido.
    const sut = new HexMaskedSpace(1, activeRow);
    // Act / Assert — la celda enmascarada es frontera, no lanza.
    expect(sut.step(new Position(1, 1), Direction.UP)).toBeNull();
    expect(sut.exitLane(new Position(1, 0), Direction.DOWN_RIGHT)).toEqual([
      new Position(1, 1),
      new Position(1, 2),
    ]);
  });

  it('should throw when the active set is empty', () => {
    // Act / Assert
    expect(() => new HexMaskedSpace(1, [])).toThrow(InvalidBoardSpaceException);
  });

  it('should throw when an active cell falls outside the base hexagon', () => {
    // Arrange — (0,0) tiene q+r=−2 en R=1: fuera del hex base.
    // Act / Assert
    expect(
      () => new HexMaskedSpace(1, [new Position(1, 1), new Position(0, 0)]),
    ).toThrow(InvalidBoardSpaceException);
  });

  it('should inherit the radius invariant from HexSpace', () => {
    // Act / Assert
    expect(() => new HexMaskedSpace(0, activeRow)).toThrow(
      InvalidBoardSpaceException,
    );
  });
});
