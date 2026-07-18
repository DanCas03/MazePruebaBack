import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { BoardSpace } from './board-space';
import { InvalidBoardSpaceException } from '../exceptions/invalid-board-space.exception';
import { InvalidDirectionException } from '../exceptions/invalid-direction.exception';

// Espacio hexagonal flat-top de radio R (ADR-0007 D1, back#59): segunda
// implementación de producción de BoardSpace. Coordenadas axiales proyectadas
// sobre Position(row,col) sin tocar el VO: q = col − R, r = row − R (así toda
// celda queda no-negativa). El hex publica 6 direcciones — up/down + las 4
// diagonales de back#58 — y es su único intérprete: nada fuera de step conoce
// los deltas hex.
export class HexSpace extends BoardSpace {
  private static readonly DIRECTIONS: readonly Direction[] = Object.freeze([
    Direction.UP,
    Direction.DOWN,
    Direction.UP_RIGHT,
    Direction.DOWN_RIGHT,
    Direction.UP_LEFT,
    Direction.DOWN_LEFT,
  ]);

  constructor(readonly radius: number) {
    super();
    if (!Number.isInteger(radius) || radius < 1) {
      throw new InvalidBoardSpaceException(
        `HexSpace(radius ${radius}): radius must be an integer >= 1`,
      );
    }
  }

  get directions(): readonly Direction[] {
    return HexSpace.DIRECTIONS;
  }

  // Hexágono grande |q| ≤ R ∧ |r| ≤ R ∧ |q+r| ≤ R en axiales.
  contains(pos: Position): boolean {
    const q = pos.col - this.radius;
    const r = pos.row - this.radius;
    return (
      Math.abs(q) <= this.radius &&
      Math.abs(r) <= this.radius &&
      Math.abs(q + r) <= this.radius
    );
  }

  // El único switch dirección→delta hexagonal del artefacto (espejo del de
  // RectSpace tras back#58): exhaustivo sobre los 8 valores, left/right son
  // ajenos (fail-fast, no frontera) y el default tipado never es el tripwire
  // de compilación ante un 9º valor de Direction.
  step(pos: Position, dir: Direction): Position | null {
    if (!this.contains(pos)) {
      return null;
    }
    let row = pos.row;
    let col = pos.col;
    switch (dir) {
      case Direction.UP:
        row--;
        break;
      case Direction.DOWN:
        row++;
        break;
      case Direction.UP_RIGHT:
        row--;
        col++;
        break;
      case Direction.DOWN_RIGHT:
        col++;
        break;
      case Direction.UP_LEFT:
        col--;
        break;
      case Direction.DOWN_LEFT:
        row++;
        col--;
        break;
      case Direction.LEFT:
      case Direction.RIGHT:
        throw new InvalidDirectionException(
          `Direction '${dir}' is not valid in HexSpace (allowed: up, down, upRight, downRight, upLeft, downLeft)`,
        );
      default: {
        const _exhaustive: never = dir;
        throw new InvalidDirectionException(
          `Unhandled direction '${_exhaustive as string}'`,
        );
      }
    }
    if (row < 0 || col < 0) {
      return null;
    }
    const neighbor = new Position(row, col);
    return this.contains(neighbor) ? neighbor : null;
  }

  // Derivado de allCells (no de la fórmula 3R²+3R+1) para que una subclase
  // que restrinja contains (HexMaskedSpace) herede un cellCount coherente —
  // mismo trato que RectSpace. La fórmula la pinnea el spec.
  get cellCount(): number {
    return Array.from(this.allCells()).length;
  }

  // Bounding box (2R+1)² filtrado por contains, orden canónico row-major.
  *allCells(): Iterable<Position> {
    const side = 2 * this.radius + 1;
    for (let row = 0; row < side; row++) {
      for (let col = 0; col < side; col++) {
        const cell = new Position(row, col);
        if (this.contains(cell)) {
          yield cell;
        }
      }
    }
  }
}
