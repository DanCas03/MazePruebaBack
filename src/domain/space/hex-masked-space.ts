import { Position } from '../value-objects/position.vo';
import { HexSpace } from './hex-space';
import { InvalidBoardSpaceException } from '../exceptions/invalid-board-space.exception';

// Gemelo enmascarado de HexSpace (ADR-0007 D5, back#59): restringe el hex a
// un set de celdas ACTIVAS (la unión de regiones de la silhouette del wire).
// Espejo deliberado del patrón HoledRectSpace — herencia, NO decorador (la
// generalización a decorador es deuda registrada en el ADR). En hex la
// silueta ES frontera jugable: asimetría consciente con rect+themed, donde la
// silueta es solo visual y el espacio sigue completo.
export class HexMaskedSpace extends HexSpace {
  private readonly active: ReadonlySet<string>;

  constructor(radius: number, active: readonly Position[]) {
    super(radius);
    if (active.length === 0) {
      throw new InvalidBoardSpaceException(
        `HexMaskedSpace(radius ${radius}): active cell set must not be empty`,
      );
    }
    for (const cell of active) {
      if (!super.contains(cell)) {
        throw new InvalidBoardSpaceException(
          `HexMaskedSpace(radius ${radius}): active cell (${cell.row}, ${cell.col}) is outside the base hexagon`,
        );
      }
    }
    this.active = new Set(active.map((cell) => `${cell.row},${cell.col}`));
  }

  // Único override (mismo trato que HoledRectSpace): la celda no activa no
  // existe — step, exitLane, areAdjacent, allCells y cellCount heredan
  // coherentes de HexSpace.
  override contains(pos: Position): boolean {
    return super.contains(pos) && this.active.has(`${pos.row},${pos.col}`);
  }
}
