import { BoardSpace } from './board-space';
import { RectSpace } from './rect-space';
import { HoledRectSpace } from './testing/holed-rect-space';
import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { InvalidBoardSpaceException } from '../exceptions/invalid-board-space.exception';

// Contract test compartido (ADR 0005): las mismas leyes geométricas corren
// contra TODA implementación de BoardSpace con instancias REALES — BoardSpace
// jamás se mockea. Las leyes se formulan sobre allCells()/directions, sin
// valores concretos, para valer en cualquier geometría (rectangular o
// agujereada). Notación en comentarios: (row, col).

// Helper: construye la lista de posiciones a partir de pares (row, col).
const positionsOf = (...coords: [number, number][]): Position[] =>
  coords.map(([row, col]) => new Position(row, col));

// Ambos espacios comparten bounding box 4 columnas x 3 filas; el agujereado
// quita la celda (1, 2), que pasa a ser FRONTERA.
const spaceCases: Array<[string, () => BoardSpace]> = [
  ['RectSpace', () => new RectSpace(4, 3)],
  ['HoledRectSpace', () => new HoledRectSpace(4, 3, [new Position(1, 2)])],
];

describe.each(spaceCases)('BoardSpace contract — %s', (_name, makeSpace) => {
  let sut: BoardSpace;

  beforeEach(() => {
    sut = makeSpace();
  });

  it('should keep step closed in the space for every cell and direction', () => {
    // Act / Assert — step devuelve null (frontera) o una celda del espacio.
    for (const cell of sut.allCells()) {
      for (const dir of sut.directions) {
        const neighbor = sut.step(cell, dir);
        if (neighbor !== null) {
          expect(sut.contains(neighbor)).toBe(true);
        }
      }
    }
  });

  it('should return null when stepping from a position outside the space in every direction', () => {
    // Arrange — (5, 5) cae fuera del bounding box de ambos espacios.
    const outside = new Position(5, 5);
    // Act / Assert
    for (const dir of sut.directions) {
      expect(sut.step(outside, dir)).toBeNull();
    }
  });

  it('should report symmetric adjacency whenever step yields a neighbor', () => {
    // Act / Assert — coherencia step↔areAdjacent: si step conecta a→b,
    // ambos órdenes de areAdjacent lo confirman (simetría en estos espacios).
    for (const cell of sut.allCells()) {
      for (const dir of sut.directions) {
        const neighbor = sut.step(cell, dir);
        if (neighbor !== null) {
          expect(sut.areAdjacent(cell, neighbor)).toBe(true);
          expect(sut.areAdjacent(neighbor, cell)).toBe(true);
        }
      }
    }
  });

  it('should never consider a cell adjacent to itself', () => {
    // Act / Assert
    for (const cell of sut.allCells()) {
      expect(sut.areAdjacent(cell, cell)).toBe(false);
    }
  });

  it('should exclude the head from every exit lane', () => {
    // Act / Assert — la cabeza se EXCLUYE del carril (igualdad por valor).
    for (const cell of sut.allCells()) {
      for (const dir of sut.directions) {
        const lane = sut.exitLane(cell, dir);
        expect(lane.some((laneCell) => laneCell.equals(cell))).toBe(false);
      }
    }
  });

  it('should chain every exit lane by step until the frontier', () => {
    // Act / Assert — lane[0] = step(head, dir); lane[i+1] = step(lane[i], dir);
    // el paso desde la última celda es frontera (null). Si step(head, dir) es
    // null, la lane es vacía y `expected` ya llega null al assert final. Toda
    // celda del carril pertenece al espacio.
    for (const cell of sut.allCells()) {
      for (const dir of sut.directions) {
        const lane = sut.exitLane(cell, dir);
        let expected = sut.step(cell, dir);
        for (const laneCell of lane) {
          expect(laneCell).toEqual(expected);
          expect(sut.contains(laneCell)).toBe(true);
          expected = sut.step(laneCell, dir);
        }
        expect(expected).toBeNull();
      }
    }
  });

  it('should enumerate only contained cells and report a coherent cellCount', () => {
    // Act
    const cells = Array.from(sut.allCells());
    // Assert — allCells ⊆ espacio y cellCount cuenta exactamente lo enumerado.
    for (const cell of cells) {
      expect(sut.contains(cell)).toBe(true);
    }
    expect(sut.cellCount).toBe(cells.length);
  });

  it('should not exceed the bounding box on either axis', () => {
    // Act / Assert — (3, 0) tiene row === rows; (0, 4) tiene col === cols.
    expect(sut.contains(new Position(3, 0))).toBe(false);
    expect(sut.contains(new Position(0, 4))).toBe(false);
  });
});

describe('HoledRectSpace — el agujero es frontera', () => {
  // SUT: bounding box 4x3 con agujero en (1, 2) — celda fuera del espacio.
  let sut: HoledRectSpace;

  beforeEach(() => {
    sut = new HoledRectSpace(4, 3, [new Position(1, 2)]);
  });

  it('should not contain the hole while containing its orthogonal neighbors', () => {
    // Act / Assert
    expect(sut.contains(new Position(1, 2))).toBe(false);
    expect(sut.contains(new Position(1, 1))).toBe(true);
    expect(sut.contains(new Position(1, 3))).toBe(true);
    expect(sut.contains(new Position(0, 2))).toBe(true);
    expect(sut.contains(new Position(2, 2))).toBe(true);
  });

  it('should return null when stepping into the hole from the left side', () => {
    // Act / Assert — pisar hacia el agujero es frontera.
    expect(sut.step(new Position(1, 1), Direction.RIGHT)).toBeNull();
  });

  it('should return null when stepping into the hole from the right side', () => {
    // Act / Assert — el agujero es frontera desde ambos lados.
    expect(sut.step(new Position(1, 3), Direction.LEFT)).toBeNull();
  });

  it('should return null when stepping from the hole itself', () => {
    // Act / Assert — el agujero está fuera del espacio: desde fuera no se pisa.
    expect(sut.step(new Position(1, 2), Direction.UP)).toBeNull();
  });

  it('should stop the horizontal exit lane before the hole excluding it', () => {
    // Act
    const lane = sut.exitLane(new Position(1, 0), Direction.RIGHT);
    // Assert — el carril termina ANTES del agujero y lo excluye.
    expect(lane).toEqual(positionsOf([1, 1]));
  });

  it('should return an empty lane when the head touches the hole frontier', () => {
    // Act / Assert — cabeza pegada a la frontera-agujero.
    expect(sut.exitLane(new Position(1, 3), Direction.LEFT)).toEqual([]);
  });

  it('should cut the vertical exit lane at the hole as well', () => {
    // Act / Assert — el agujero también corta el carril vertical.
    expect(sut.exitLane(new Position(0, 2), Direction.DOWN)).toEqual([]);
  });

  it('should report no adjacency between the hole and its neighbors', () => {
    // Act / Assert — nadie es vecino de un agujero, en ningún orden.
    expect(sut.areAdjacent(new Position(1, 1), new Position(1, 2))).toBe(false);
    expect(sut.areAdjacent(new Position(1, 2), new Position(1, 3))).toBe(false);
  });

  it('should enumerate eleven cells omitting the hole with a matching cellCount', () => {
    // Act
    const cells = Array.from(sut.allCells());
    // Assert — 12 celdas del bounding box menos 1 agujero.
    expect(cells).toHaveLength(11);
    expect(cells.some((cell) => cell.equals(new Position(1, 2)))).toBe(false);
    expect(sut.cellCount).toBe(11);
  });

  it('should yield a shorter lane than the plain RectSpace for the same call', () => {
    // Arrange — misma llamada, geometría distinta.
    const rect = new RectSpace(4, 3);
    // Act
    const rectLane = rect.exitLane(new Position(1, 0), Direction.RIGHT);
    const holedLane = sut.exitLane(new Position(1, 0), Direction.RIGHT);
    // Assert
    expect(rectLane).toHaveLength(3);
    expect(holedLane).toHaveLength(1);
  });

  it('should inherit the dimension invariant and throw when cols is 0', () => {
    // Act / Assert
    expect(() => new HoledRectSpace(0, 3, [])).toThrow(
      InvalidBoardSpaceException,
    );
  });
});
