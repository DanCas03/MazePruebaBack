import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { BoardSpace } from './board-space';
import { InvalidBoardSpaceException } from '../exceptions/invalid-board-space.exception';
import { InvalidDirectionException } from '../exceptions/invalid-direction.exception';

// Espacio rectangular cols×rows: la única implementación de producción de
// BoardSpace (ADR 0005). Todos los niveles servidos hoy son rectangulares;
// el builder y el mapper son los únicos que lo construyen/conocen en
// concreto (wire 2D legítimo).
export class RectSpace extends BoardSpace {
  private static readonly DIRECTIONS: readonly Direction[] = Object.freeze([
    Direction.UP,
    Direction.DOWN,
    Direction.LEFT,
    Direction.RIGHT,
  ]);

  constructor(
    readonly cols: number,
    readonly rows: number,
  ) {
    super();
    if (
      !Number.isInteger(cols) ||
      cols < 1 ||
      !Number.isInteger(rows) ||
      rows < 1
    ) {
      throw new InvalidBoardSpaceException(
        `RectSpace(${cols}x${rows}): cols and rows must be integers >= 1`,
      );
    }
  }

  get directions(): readonly Direction[] {
    return RectSpace.DIRECTIONS;
  }

  // Solo cotas superiores: Position garantiza row/col >= 0 por invariante.
  contains(pos: Position): boolean {
    return pos.row < this.rows && pos.col < this.cols;
  }

  // El ÚNICO switch dirección→delta del artefacto (ADR 0005, D3): nada fuera
  // de este método interpreta Direction, salvo el wire (factory/mapper).
  // Guardado por contains en ambos extremos: pisar desde fuera del espacio o
  // hacia fuera de él devuelve null (frontera), nunca lanza. Las 4 diagonales
  // NO pertenecen a este espacio (back#58): pisar en una es fail-fast, no
  // frontera — lanza InvalidDirectionException. El switch es exhaustivo sobre
  // los 8 valores; el `default` tipado a `never` es el tripwire que rompe la
  // compilación si Direction gana un 9º valor sin manejarse aquí.
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
      case Direction.LEFT:
        col--;
        break;
      case Direction.RIGHT:
        col++;
        break;
      case Direction.UP_LEFT:
      case Direction.UP_RIGHT:
      case Direction.DOWN_LEFT:
      case Direction.DOWN_RIGHT:
        throw new InvalidDirectionException(
          `Direction '${dir}' is not valid in RectSpace (allowed: up, down, left, right)`,
        );
      default: {
        const _exhaustive: never = dir;
        throw new InvalidDirectionException(
          `Unhandled direction '${_exhaustive as string}'`,
        );
      }
    }
    // Guarda previa a construir: Position rechaza coordenadas negativas y la
    // frontera es un resultado normal, no una excepción de control de flujo.
    if (row < 0 || col < 0) {
      return null;
    }
    const neighbor = new Position(row, col);
    return this.contains(neighbor) ? neighbor : null;
  }

  get cellCount(): number {
    return Array.from(this.allCells()).length;
  }

  // Itera el bounding box filtrando por contains: una subclase que restrinja
  // contains (p.ej. la certificación agujereada de ADR 0005) hereda allCells
  // y cellCount coherentes sin sobreescribir nada más.
  *allCells(): Iterable<Position> {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = new Position(row, col);
        if (this.contains(cell)) {
          yield cell;
        }
      }
    }
  }
}
