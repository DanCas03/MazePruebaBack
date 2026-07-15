import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { ArrowId } from '../value-objects/arrow-id.vo';
import { InvalidArrowException } from '../exceptions/invalid-arrow.exception';

// Flecha como CAMINO, espejo del modelo canónico del front
// (MazePruebaFront/lib/domain/arrows/entities/arrow.dart): `cells` va de la
// cola (índice 0) a la cabeza (último). En el backend es SOLO datos: sin
// comportamiento de juego. `headDir` es la dirección por la que la cabeza
// abandona el tablero y NO se valida contra la geometría del camino (una
// serpiente doblada puede apuntar a cualquier lado). Invariantes propias:
// solo las independientes del espacio (no-vacío, sin celdas repetidas); la
// adyacencia del camino es geometría y la valida Level vía
// BoardSpace.areAdjacent (ADR 0005) — Arrow es dato puro.
export class Arrow {
  readonly cells: readonly Position[];

  constructor(
    readonly id: ArrowId,
    cells: Position[],
    readonly headDir: Direction,
  ) {
    if (cells.length === 0) {
      throw new InvalidArrowException(
        `Arrow(${id.value}): cells cannot be empty`,
      );
    }
    const seen = new Set<string>();
    for (const cell of cells) {
      const key = `${cell.row},${cell.col}`;
      if (seen.has(key)) {
        throw new InvalidArrowException(
          `Arrow(${id.value}): repeated cell (${cell.row}, ${cell.col})`,
        );
      }
      seen.add(key);
    }
    this.cells = Object.freeze([...cells]);
  }

  equals(other: Arrow): boolean {
    return (
      this.id.equals(other.id) &&
      this.headDir === other.headDir &&
      this.cells.length === other.cells.length &&
      this.cells.every((cell, i) => cell.equals(other.cells[i]))
    );
  }
}
