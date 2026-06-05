import { Position } from '../value-objects/position.vo';
import { CellType } from '../value-objects/cell-type.vo';

/**
 * Abstracción base de toda celda del tablero.
 *
 * OCP (Open/Closed): el código cliente depende SOLO de esta abstracción. Para
 * añadir un nuevo tipo de celda se crea una subclase nueva, sin modificar las
 * existentes ni a los consumidores.
 *
 * LSP (Liskov): cualquier subclase es sustituible donde se espere un `ICell`;
 * todas honran el contrato `isPassable()` sin cambiar su semántica.
 *
 * DDD: el estado de la celda se compone de Value Objects ([Position], [CellType])
 * en lugar de primitivos sueltos.
 */
export abstract class ICell {
  protected constructor(
    public readonly position: Position,
    public readonly cellType: CellType,
  ) {}

  /** Indica si el jugador puede situarse sobre esta celda. */
  abstract isPassable(): boolean;
}
