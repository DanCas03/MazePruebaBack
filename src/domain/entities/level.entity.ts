import { LevelId } from '../value-objects/level-id.vo';
import { Arrow } from './arrow.entity';
import { BoardSpace } from '../space/board-space';
import { InvalidLevelException } from '../exceptions/invalid-level.exception';

// Sección del catálogo (ADR 0004, back#31): campaña (con orden de juego) o
// temático (sin orden). Ausente en datos viejos => campaign (retro-compat).
export type LevelSection = 'campaign' | 'themed';

// Instrucciones de pintado (ADR 0004): paleta de roles de color + rol por
// flecha (clave = ArrowId plano). Es un PORTADOR OPACO: el dominio no lo
// valida ni lo interpreta — LevelSolver y LevelBuilder lo ignoran. La única
// verificación de forma (rol existente, hex #RRGGBB) vive en el seed, la
// frontera donde entran los fixtures.
export interface LevelPaint {
  readonly palette: Readonly<Record<string, string>>;
  readonly roles: Readonly<Record<string, string>>;
}

// Máscara de silueta temática (ADR 0004, back#53): celdas de relleno de cada
// región de la figura, clave = nombre de región, valor = lista de pares
// [row, col]. Es un PORTADOR OPACO como LevelPaint: el dominio no lo valida
// ni lo interpreta — LevelSolver y LevelBuilder lo ignoran. La única
// verificación de forma vive en el seed, la frontera donde entran los
// fixtures.
export type LevelSilhouette = Readonly<
  Record<string, ReadonlyArray<readonly [number, number]>>
>;

// Definición de nivel arrow-path (ADR 0001, wire contract en CONTEXT-MAP.md):
// el backend guarda y sirve el nivel como DATOS; la mecánica corre en el
// cliente. timeLimitSec obligatorio (ADR 0006, back scoring): límite de
// tiempo autoritativo para el cálculo de puntaje en el back.
// Decisión back#31: section/paint viajan EN la entidad (y no tuplados en el
// repositorio) para que el mapper reciba un solo objeto; siguen siendo datos
// opacos sin comportamiento ni invariantes de dominio.
// ADR 0005 (back#36): el agregado SOSTIENE el espacio — acepta cualquier
// BoardSpace y valida su geometría a través de él (in-space, adyacencia del
// camino, solapamiento), sin conocer ninguna implementación en concreto.
export class Level {
  readonly arrows: readonly Arrow[];
  // Bounding box del espacio para el wire (`cols`/`rows` del contrato HTTP):
  // campos derivados de space.allCells() en construcción — coherentes con el
  // espacio por construcción, sin que Level ni application conozcan RectSpace
  // (ADR 0005: solo builder y mapper son wire legítimamente 2D).
  readonly cols: number;
  readonly rows: number;

  constructor(
    readonly id: LevelId,
    readonly space: BoardSpace,
    arrows: Arrow[],
    readonly timeLimitSec: number,
    readonly section: LevelSection = 'campaign',
    readonly paint?: LevelPaint,
    readonly silhouette?: LevelSilhouette,
  ) {
    if (!Number.isInteger(timeLimitSec) || timeLimitSec < 1) {
      throw new InvalidLevelException(
        `Level(${id.value}): timeLimitSec must be an integer >= 1 (got ${timeLimitSec})`,
      );
    }
    const arrowIds = new Set<string>();
    const occupied = new Set<string>();
    for (const arrow of arrows) {
      if (arrowIds.has(arrow.id.value)) {
        throw new InvalidLevelException(
          `Level(${id.value}): duplicated arrow id '${arrow.id.value}'`,
        );
      }
      arrowIds.add(arrow.id.value);
      for (const cell of arrow.cells) {
        if (!space.contains(cell)) {
          throw new InvalidLevelException(
            `Level(${id.value}): arrow '${arrow.id.value}' cell (${cell.row}, ${cell.col}) is outside the board space`,
          );
        }
        const key = `${cell.row},${cell.col}`;
        if (occupied.has(key)) {
          throw new InvalidLevelException(
            `Level(${id.value}): cell (${cell.row}, ${cell.col}) is shared by two arrows`,
          );
        }
        occupied.add(key);
      }
      // Adyacencia del camino: mudada desde Arrow (ADR 0005) — es geometría
      // del espacio, no invariante del dato.
      for (let i = 1; i < arrow.cells.length; i++) {
        if (!space.areAdjacent(arrow.cells[i - 1], arrow.cells[i])) {
          throw new InvalidLevelException(
            `Level(${id.value}): arrow '${arrow.id.value}' cells[${i - 1}] and cells[${i}] must be adjacent in the board space`,
          );
        }
      }
    }
    let cols = 0;
    let rows = 0;
    for (const cell of space.allCells()) {
      if (cell.col >= cols) {
        cols = cell.col + 1;
      }
      if (cell.row >= rows) {
        rows = cell.row + 1;
      }
    }
    this.cols = cols;
    this.rows = rows;
    this.arrows = Object.freeze([...arrows]);
  }
}
