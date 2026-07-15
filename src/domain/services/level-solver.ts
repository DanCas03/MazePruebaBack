import { Level } from '../entities/level.entity';
import { ArrowId } from '../value-objects/arrow-id.vo';

// Servicio de dominio puro (ADR 0002): decide si un Level arrow-path es
// soluble y produce la Solución canónica (el orden de remoción que vacía el
// tablero). back#30: implementado sobre el Grafo de bloqueos (CONTEXT.md) —
// nodo = Arrow, arista Y→X cuando Y ocupa el carril de salida de X — pelado
// con un min-heap por índice congelado en level.arrows. Correcto y completo
// porque quitar flechas solo libera celdas (monotonicidad, ADR 0001 dec. 6):
// una flecha con in-degree 0 lo conserva hasta ser pelada. Pelar siempre el
// elegible de índice congelado más bajo reproduce byte-idéntico el replay
// greedy previo (que escaneaba level.arrows desde 0 y reiniciaba tras cada
// remoción) — ADR 0002 dec. 5. La geometría de salida vive en BoardSpace
// (ADR 0005): el solver consulta level.space.exitLane(head, headDir) — el
// carril cercano→frontera que espeja la mecánica canónica del front
// (arrow.dart / arrow_board.dart) — y no interpreta Direction ni hace
// aritmética de celdas. Arrow/Level siguen siendo solo datos: toda la
// mecánica (grafo incluido) es privada de este servicio. Sin estado entre
// llamadas ni dependencias; instanciable para proveerlo por DI (back#19).
export class LevelSolver {
  // Un orden de remoción válido que vacía el tablero (la Solución), o null
  // si el nivel es insoluble. Determinista para un Level dado. Nivel vacío
  // => [] (soluble por vacuidad). Asume las invariantes de Level (in-bounds,
  // sin solape, ids únicos); no revalida.
  solve(level: Level): ArrowId[] | null {
    const { order, residue } = this.peel(level);
    return residue.length === 0 ? order : null;
  }

  // AC de back#6: true solo si existe un orden que vacía el tablero. Es la
  // proyección booleana del certificado (ADR 0002, decisión 2).
  isSolvable(level: Level): boolean {
    return this.solve(level) !== null;
  }

  // Construye el Grafo de bloqueos y lo pela. `order` es el prefijo pelado;
  // `residue` es el núcleo no pelable (los ciclos que hacen insoluble el
  // nivel) — diagnóstico interno, NO expuesto en la interface (decisión de
  // back#30). Coste O(A·L + A·(cols+rows) + E + V·log V) frente al ~O(A³)
  // del replay greedy previo.
  private peel(level: Level): { order: ArrowId[]; residue: ArrowId[] } {
    const arrows = level.arrows;
    const count = arrows.length;

    // Mapa de ocupación celda → índice de flecha, construido una sola vez.
    const occupant = new Map<string, number>();
    for (let i = 0; i < count; i++) {
      for (const cell of arrows[i].cells) {
        occupant.set(`${cell.row},${cell.col}`, i);
      }
    }

    // Aristas Y→X (Y bloquea a X) + in-degree por nodo. Una cabeza pegada
    // a la frontera tiene carril vacío ⇒ in-degree 0 siempre (mecánica
    // serpiente: el cuerpo se retrae por su propio camino). Las celdas del
    // carril ocupadas por la propia flecha no bloquean, espejo del canExit
    // previo. El carril lo da el espacio del nivel (ADR 0005), así que un
    // BoardSpace distinto cambia la geometría sin tocar este algoritmo.
    const blocks: number[][] = Array.from({ length: count }, () => []);
    const blockersCount = new Array<number>(count).fill(0);
    for (let x = 0; x < count; x++) {
      const head = arrows[x].cells[arrows[x].cells.length - 1];
      const seenBlockers = new Set<number>();
      for (const cell of level.space.exitLane(head, arrows[x].headDir)) {
        const y = occupant.get(`${cell.row},${cell.col}`);
        if (y !== undefined && y !== x && !seenBlockers.has(y)) {
          seenBlockers.add(y);
          blocks[y].push(x);
          blockersCount[x]++;
        }
      }
    }

    // Conjunto "listo" (in-degree 0) como min-heap por índice congelado:
    // extraer el mínimo = la primera flecha del escaneo greedy previo.
    const ready = new MinIndexHeap(count);
    for (let i = 0; i < count; i++) {
      if (blockersCount[i] === 0) {
        ready.push(i);
      }
    }

    const order: ArrowId[] = [];
    const peeled = new Array<boolean>(count).fill(false);
    while (!ready.isEmpty()) {
      const y = ready.pop();
      peeled[y] = true;
      order.push(arrows[y].id);
      // Pelar Y libera sus celdas: decrementa el in-degree de cada X al que
      // bloqueaba; los que llegan a 0 entran al conjunto listo.
      for (const x of blocks[y]) {
        blockersCount[x]--;
        if (blockersCount[x] === 0) {
          ready.push(x);
        }
      }
    }

    const residue: ArrowId[] = [];
    for (let i = 0; i < count; i++) {
      if (!peeled[i]) {
        residue.push(arrows[i].id);
      }
    }
    return { order, residue };
  }
}

// Min-heap binario de índices (helper privado del módulo, no exportado):
// da el "extraer elegible de índice congelado más bajo" en O(log n) sin
// dependencias nuevas. Capacidad fija = nº de flechas: cada índice entra al
// heap a lo sumo una vez (cuando su in-degree llega a 0).
class MinIndexHeap {
  private readonly heap: number[];
  private size = 0;

  constructor(capacity: number) {
    this.heap = new Array<number>(capacity);
  }

  isEmpty(): boolean {
    return this.size === 0;
  }

  push(value: number): void {
    let i = this.size++;
    this.heap[i] = value;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent] <= this.heap[i]) {
        break;
      }
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  pop(): number {
    const top = this.heap[0];
    this.size--;
    this.heap[0] = this.heap[this.size];
    let i = 0;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let smallest = i;
      if (left < this.size && this.heap[left] < this.heap[smallest]) {
        smallest = left;
      }
      if (right < this.size && this.heap[right] < this.heap[smallest]) {
        smallest = right;
      }
      if (smallest === i) {
        return top;
      }
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}
