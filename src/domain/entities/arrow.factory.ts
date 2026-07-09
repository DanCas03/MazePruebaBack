import { Arrow } from './arrow.entity';
import { ArrowId } from '../value-objects/arrow-id.vo';
import { Direction } from '../value-objects/direction.vo';
import { Position } from '../value-objects/position.vo';
import { InvalidArrowException } from '../exceptions/invalid-arrow.exception';
import { InvalidDirectionException } from '../exceptions/invalid-direction.exception';

// Forma wire de una flecha (CONTEXT-MAP.md): tal como llega en el JSON
// arrow-path y como se guarda dentro de Level.data.
export interface ArrowPrimitives {
  id: string;
  headDir: string;
  cells: number[][];
}

// Factory Method: frontera primitivos -> dominio. El JSON arrow-path llega
// como primitivos sin garantías; construir un Arrow válido exige parsear la
// dirección (case-insensitive), validar la forma de cada celda y disparar
// los invariantes de los VOs y de Arrow. Centralizarlo aquí evita que cada
// consumidor (repositorio de niveles y seed, back#5/back#10) repita ese
// parseo, y garantiza que todo Arrow del sistema nace válido.
export class ArrowFactory {
  static create(raw: ArrowPrimitives): Arrow {
    return new Arrow(
      new ArrowId(raw.id),
      raw.cells.map((cell, i) => ArrowFactory.toPosition(raw.id, cell, i)),
      ArrowFactory.parseDirection(raw.headDir),
    );
  }

  private static parseDirection(raw: string): Direction {
    const normalized = raw.toLowerCase();
    const match = Object.values(Direction).find(
      (d) => (d as string) === normalized,
    );
    if (!match) {
      throw new InvalidDirectionException(
        `'${raw}' is not a valid direction (expected up|down|left|right)`,
      );
    }
    return match;
  }

  private static toPosition(
    arrowId: string,
    cell: number[],
    index: number,
  ): Position {
    if (
      !Array.isArray(cell) ||
      cell.length !== 2 ||
      !Number.isInteger(cell[0]) ||
      !Number.isInteger(cell[1])
    ) {
      throw new InvalidArrowException(
        `Arrow(${arrowId}): cells[${index}] must be an integer pair [row, col]`,
      );
    }
    return new Position(cell[0], cell[1]);
  }
}
