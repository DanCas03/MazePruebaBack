import { LevelId } from '../value-objects/level-id.vo';
import { Arrow } from './arrow.entity';
import { InvalidLevelException } from '../exceptions/invalid-level.exception';

// Definición de nivel arrow-path (ADR 0001, wire contract en CONTEXT-MAP.md):
// el backend guarda y sirve el nivel como DATOS; la mecánica corre en el
// cliente. timeLimitSec opcional: límite de tiempo para niveles avanzados.
export class Level {
  readonly arrows: readonly Arrow[];

  constructor(
    readonly id: LevelId,
    readonly cols: number,
    readonly rows: number,
    arrows: Arrow[],
    readonly timeLimitSec?: number,
  ) {
    if (
      !Number.isInteger(cols) ||
      cols < 1 ||
      !Number.isInteger(rows) ||
      rows < 1
    ) {
      throw new InvalidLevelException(
        `Level(${id.value}): cols and rows must be integers >= 1 (got ${cols}x${rows})`,
      );
    }
    if (
      timeLimitSec !== undefined &&
      (!Number.isInteger(timeLimitSec) || timeLimitSec < 1)
    ) {
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
        if (cell.row >= rows || cell.col >= cols) {
          throw new InvalidLevelException(
            `Level(${id.value}): arrow '${arrow.id.value}' cell (${cell.row}, ${cell.col}) is out of bounds for ${cols}x${rows}`,
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
    }
    this.arrows = Object.freeze([...arrows]);
  }
}
