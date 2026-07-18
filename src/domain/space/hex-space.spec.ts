import { HexSpace } from './hex-space';
import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { InvalidBoardSpaceException } from '../exceptions/invalid-board-space.exception';
import { InvalidDirectionException } from '../exceptions/invalid-direction.exception';

// HexSpace (ADR-0007 D1, back#59): hex flat-top de radio R sobre axiales
// q = col - R, r = row - R. Notación en comentarios: (row, col).
describe('HexSpace', () => {
  it.each([[0], [-1], [1.5], [NaN]])(
    'should throw for invalid radius %p',
    (radius) => {
      // Act / Assert
      expect(() => new HexSpace(radius)).toThrow(InvalidBoardSpaceException);
    },
  );

  it('should publish exactly the six hex directions without left/right', () => {
    // Arrange
    const sut = new HexSpace(2);
    // Act / Assert
    expect(sut.directions).toEqual([
      Direction.UP,
      Direction.DOWN,
      Direction.UP_RIGHT,
      Direction.DOWN_RIGHT,
      Direction.UP_LEFT,
      Direction.DOWN_LEFT,
    ]);
  });

  it('should contain the center and the six corners of the hexagon', () => {
    // Arrange — R=2: centro (2,2); esquinas axiales (±R,0),(0,±R),(R,−R),(−R,R).
    const sut = new HexSpace(2);
    // Act / Assert
    expect(sut.contains(new Position(2, 2))).toBe(true); // q=0, r=0
    expect(sut.contains(new Position(0, 2))).toBe(true); // q=0, r=−2
    expect(sut.contains(new Position(4, 2))).toBe(true); // q=0, r=+2
    expect(sut.contains(new Position(2, 0))).toBe(true); // q=−2, r=0
    expect(sut.contains(new Position(2, 4))).toBe(true); // q=+2, r=0
    expect(sut.contains(new Position(0, 4))).toBe(true); // q=+2, r=−2
  });

  it('should exclude the bounding-box corners cut by |q+r| > R', () => {
    // Arrange — R=2: (0,0) tiene q=−2,r=−2 (q+r=−4); (4,4) tiene q+r=+4.
    const sut = new HexSpace(2);
    // Act / Assert
    expect(sut.contains(new Position(0, 0))).toBe(false);
    expect(sut.contains(new Position(4, 4))).toBe(false);
    expect(sut.contains(new Position(0, 1))).toBe(false); // q=−1, r=−2 → q+r=−3
    expect(sut.contains(new Position(5, 2))).toBe(false); // r=+3 fuera de eje
  });

  it.each([
    [1, 7],
    [2, 19],
    [3, 37],
    [4, 61],
    [5, 91],
  ])('should count 3R²+3R+1 cells for radius %i', (radius, expected) => {
    // Act / Assert
    expect(new HexSpace(radius).cellCount).toBe(expected);
  });

  it('should step from the center to its six neighbors with hex deltas', () => {
    // Arrange — R=2, centro (2,2).
    const sut = new HexSpace(2);
    const center = new Position(2, 2);
    // Act / Assert — deltas (drow, dcol) de la convención canónica.
    expect(sut.step(center, Direction.UP)).toEqual(new Position(1, 2));
    expect(sut.step(center, Direction.DOWN)).toEqual(new Position(3, 2));
    expect(sut.step(center, Direction.UP_RIGHT)).toEqual(new Position(1, 3));
    expect(sut.step(center, Direction.DOWN_RIGHT)).toEqual(new Position(2, 3));
    expect(sut.step(center, Direction.UP_LEFT)).toEqual(new Position(2, 1));
    expect(sut.step(center, Direction.DOWN_LEFT)).toEqual(new Position(3, 1));
  });

  it('should return null when stepping across the hex frontier', () => {
    // Arrange — R=1: (0,1) es el vértice superior (q=0, r=−1).
    const sut = new HexSpace(1);
    // Act / Assert — up sale del hex; downLeft desde (0,2) va a (1,1) (dentro).
    expect(sut.step(new Position(0, 1), Direction.UP)).toBeNull();
    expect(sut.step(new Position(0, 2), Direction.UP_RIGHT)).toBeNull();
  });

  it('should throw when stepping left or right (foreign directions)', () => {
    // Arrange
    const sut = new HexSpace(2);
    const center = new Position(2, 2);
    // Act / Assert — fail-fast, nunca frontera (ley del contrato, back#58).
    expect(() => sut.step(center, Direction.LEFT)).toThrow(
      InvalidDirectionException,
    );
    expect(() => sut.step(center, Direction.RIGHT)).toThrow(
      InvalidDirectionException,
    );
  });

  it('should build the inherited exit lane along a diagonal until the frontier', () => {
    // Arrange — R=2, cabeza en el vértice izquierdo (2,0), dirección downRight
    // recorre la fila r=0 completa: (2,1), (2,2), (2,3), (2,4).
    const sut = new HexSpace(2);
    // Act
    const lane = sut.exitLane(new Position(2, 0), Direction.DOWN_RIGHT);
    // Assert — orden cercano→frontera, cabeza excluida.
    expect(lane).toEqual([
      new Position(2, 1),
      new Position(2, 2),
      new Position(2, 3),
      new Position(2, 4),
    ]);
  });

  it('should inherit adjacency from step for hex neighbors only', () => {
    // Arrange — R=2: (2,2) y (1,3) son vecinos upRight; (2,2) y (0,2) no.
    const sut = new HexSpace(2);
    // Act / Assert
    expect(sut.areAdjacent(new Position(2, 2), new Position(1, 3))).toBe(true);
    expect(sut.areAdjacent(new Position(2, 2), new Position(0, 2))).toBe(false);
  });

  it('should enumerate allCells in canonical row-major order', () => {
    // Arrange — R=1: 7 celdas del hex dentro del bounding box 3×3.
    const sut = new HexSpace(1);
    // Act
    const cells = Array.from(sut.allCells()).map((c) => [c.row, c.col]);
    // Assert — row-major, excluidos (0,0) y (2,2) por |q+r| > 1.
    expect(cells).toEqual([
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 0],
      [2, 1],
    ]);
  });
});
