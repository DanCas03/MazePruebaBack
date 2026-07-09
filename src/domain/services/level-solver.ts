import { Level } from '../entities/level.entity';
import { Arrow } from '../entities/arrow.entity';
import { ArrowId } from '../value-objects/arrow-id.vo';
import { Direction } from '../value-objects/direction.vo';
import { Position } from '../value-objects/position.vo';

// Servicio de dominio puro (ADR 0002): decide si un Level arrow-path es
// soluble y produce la Solución canónica (el orden de remoción que vacía el
// tablero). Replay greedy sin backtracking: correcto y completo porque quitar
// flechas solo libera celdas (monotonicidad, ADR 0001 dec. 6) — una flecha
// que puede salir ahora podrá salir siempre. La geometría de salida espeja
// EXACTO la mecánica canónica del front:
//   exitPath -> MazePruebaFront/lib/domain/arrows/entities/arrow.dart
//   canExit  -> MazePruebaFront/lib/domain/arrows/entities/arrow_board.dart
// Arrow/Level siguen siendo solo datos: toda la mecánica es privada de este
// servicio. Sin estado ni dependencias; instanciable para proveerlo por DI
// cuando back#19 lo exponga.
export class LevelSolver {
  // Un orden de remoción válido que vacía el tablero (la Solución), o null
  // si el nivel es insoluble. Determinista para un Level dado: greedy sobre
  // el orden congelado de level.arrows, reiniciando el escaneo tras cada
  // remoción. Nivel vacío => [] (soluble por vacuidad). Asume las
  // invariantes de Level (in-bounds, sin solape, ids únicos); no revalida.
  solve(level: Level): ArrowId[] | null {
    const remaining = [...level.arrows];
    const order: ArrowId[] = [];
    let removedSomething = true;
    while (removedSomething) {
      removedSomething = false;
      for (let i = 0; i < remaining.length; i++) {
        if (this.canExit(remaining[i], remaining, level.cols, level.rows)) {
          order.push(remaining[i].id);
          remaining.splice(i, 1);
          removedSomething = true;
          break;
        }
      }
    }
    return remaining.length === 0 ? order : null;
  }

  // AC de back#6: true solo si existe un orden que vacía el tablero. Es la
  // proyección booleana del certificado (ADR 0002, decisión 2).
  isSolvable(level: Level): boolean {
    return this.solve(level) !== null;
  }

  // Espejo de ArrowBoard.canExit + _occupiedExcluding: toda celda del carril
  // de salida libre de las celdas de las OTRAS flechas restantes.
  private canExit(
    arrow: Arrow,
    remaining: readonly Arrow[],
    cols: number,
    rows: number,
  ): boolean {
    const occupied = new Set<string>();
    for (const other of remaining) {
      if (other.id.equals(arrow.id)) {
        continue;
      }
      for (const cell of other.cells) {
        occupied.add(`${cell.row},${cell.col}`);
      }
    }
    return this.exitPath(arrow, cols, rows).every(
      (cell) => !occupied.has(`${cell.row},${cell.col}`),
    );
  }

  // Espejo de Arrow.exitPath: carril recto desde head+1 hasta el borde en
  // headDir. Vacío si la cabeza toca el borde => la flecha sale siempre
  // (mecánica serpiente: el cuerpo se retrae por su propio camino).
  private exitPath(arrow: Arrow, cols: number, rows: number): Position[] {
    const head = arrow.cells[arrow.cells.length - 1];
    const path: Position[] = [];
    switch (arrow.headDir) {
      case Direction.RIGHT:
        for (let col = head.col + 1; col < cols; col++) {
          path.push(new Position(head.row, col));
        }
        break;
      case Direction.LEFT:
        for (let col = head.col - 1; col >= 0; col--) {
          path.push(new Position(head.row, col));
        }
        break;
      case Direction.DOWN:
        for (let row = head.row + 1; row < rows; row++) {
          path.push(new Position(row, head.col));
        }
        break;
      case Direction.UP:
        for (let row = head.row - 1; row >= 0; row--) {
          path.push(new Position(row, head.col));
        }
        break;
    }
    return path;
  }
}
