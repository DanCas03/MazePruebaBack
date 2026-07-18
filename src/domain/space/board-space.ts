import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';

// BoardSpace (ADR 0005, CONTEXT.md): la geometría del tablero como módulo
// profundo del dominio — qué celdas existen, cuáles son vecinas y qué carril
// recto lleva de una cabeza a la FRONTERA. Interfaz espejo de la Dart del
// front. `step` es la única primitiva geométrica; todo lo demás se deriva de
// ella, de modo que un espacio nuevo (agujereado, 3D) solo redefine qué es
// "dar un paso" sin tocar a ningún consumidor (Level, LevelSolver).
export abstract class BoardSpace {
  abstract get directions(): readonly Direction[];

  abstract contains(pos: Position): boolean;

  // Celda vecina de `pos` en `dir`, o null si el paso sale del espacio
  // (frontera). null es resultado normal, nunca una excepción. Precondición
  // (ADR-0007, back#58): `dir` debe pertenecer a `directions`; pisar en una
  // dirección ajena al espacio es fail-fast y lanza InvalidDirectionException
  // — no es frontera. La ley la verifica board-space.contract.spec.ts contra
  // toda implementación.
  abstract step(pos: Position, dir: Direction): Position | null;

  abstract get cellCount(): number;

  abstract allCells(): Iterable<Position>;

  // Template Method (GoF): resuelve que cada espacio repita la definición de
  // vecindad — dos celdas son adyacentes si existe una dirección cuyo paso
  // conecta la primera con la segunda. Derivarla de `step` garantiza que
  // adyacencia y carriles nunca divergen.
  areAdjacent(a: Position, b: Position): boolean {
    for (const dir of this.directions) {
      const neighbor = this.step(a, dir);
      if (neighbor !== null && neighbor.equals(b)) {
        return true;
      }
    }
    return false;
  }

  // Template Method (GoF): el carril de salida — step* desde `head` (que se
  // EXCLUYE) hasta la frontera, en orden cercano→frontera. Vacío si la cabeza
  // ya toca la frontera. Es la geometría que LevelSolver consulta para el
  // Grafo de bloqueos; su orden está pinneado por el golden master.
  exitLane(head: Position, dir: Direction): Position[] {
    const lane: Position[] = [];
    let cell = this.step(head, dir);
    while (cell !== null) {
      lane.push(cell);
      cell = this.step(cell, dir);
    }
    return lane;
  }
}
