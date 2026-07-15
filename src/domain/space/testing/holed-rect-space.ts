import { Position } from '../../value-objects/position.vo';
import { RectSpace } from '../rect-space';

// Segundo adapter de certificación (ADR 0005): un adapter = seam hipotético,
// dos = seam real. Vive SOLO en tests — la carpeta testing/ está excluida de
// tsconfig.build.json, así que nunca llega a dist (sin código dormido en
// producción). No es una feature: certifica que BoardSpace no tiene forma
// rectangular encubierta y que los consumidores (Level, LevelSolver) no
// dependen de RectSpace.
export class HoledRectSpace extends RectSpace {
  private readonly holes: ReadonlySet<string>;

  constructor(cols: number, rows: number, holes: readonly Position[]) {
    super(cols, rows);
    this.holes = new Set(holes.map((hole) => `${hole.row},${hole.col}`));
  }

  // Único override (ADR 0005): el agujero no existe en el espacio. step,
  // areAdjacent, exitLane, allCells y cellCount heredan coherentes de
  // RectSpace — el carril termina en el agujero: el agujero es FRONTERA.
  override contains(pos: Position): boolean {
    return super.contains(pos) && !this.holes.has(`${pos.row},${pos.col}`);
  }
}
