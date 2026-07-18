// Herramienta puntual de autoría (hex denso): NO producto. Genera un nivel
// hexagonal por inserción inversa centro→fuera — cada flecha se inserta con su
// carril de salida libre de las ya insertadas, así el orden inverso de
// inserción ES una solución (solubilidad por construcción, luego re-verificada
// con el LevelSolver real). Uso:
//   npx ts-node scripts/generate-hex-level.ts --figure free --id hex-03 \
//     --radius 5 --fill 0.95 --max-len 5 --seed 7
//   npx ts-node scripts/generate-hex-level.ts --figure snowflake \
//     --id t-snowflake --radius 6 --seed 3
import * as fs from 'fs';
import * as path from 'path';
import { LevelSolver } from '../src/domain/services/level-solver';
import {
  LevelFixture,
  buildLevelFromFixture,
  suggestTimeLimitSec,
} from '../src/infrastructure/database/level-fixture';
import { validateLevelSilhouette } from '../src/infrastructure/database/level-silhouette.validator';
import { validateLevelPaint } from '../src/infrastructure/database/level-paint.validator';

type Cell = readonly [number, number]; // [row, col]
type Dir = 'up' | 'down' | 'upRight' | 'downRight' | 'upLeft' | 'downLeft';

// Deltas [dRow, dCol] espejo de HexSpace.step (único intérprete real).
const DELTAS: Record<Dir, readonly [number, number]> = {
  up: [-1, 0],
  down: [1, 0],
  upRight: [-1, 1],
  downRight: [0, 1],
  upLeft: [0, -1],
  downLeft: [1, -1],
};
const DIRS = Object.keys(DELTAS) as Dir[];

// Proyección flat-top a píxel (misma fórmula que HexGeometry del front) para
// sesgos "hacia fuera" y orden centro→fuera coherentes con lo que se VE.
function pixel(radius: number, [row, col]: Cell): [number, number] {
  const q = col - radius;
  const r = row - radius;
  return [1.5 * q, Math.sqrt(3) * (r + q / 2)];
}

function hexDist(radius: number, [row, col]: Cell): number {
  const q = col - radius;
  const r = row - radius;
  return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
}

const key = ([row, col]: Cell): string => `${row},${col}`;

// PRNG determinista (mulberry32): misma semilla ⇒ mismo nivel.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], rnd: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Siluetas
// ---------------------------------------------------------------------------

function fullHexCells(radius: number): Cell[] {
  const cells: Cell[] = [];
  const side = 2 * radius + 1;
  for (let row = 0; row < side; row++) {
    for (let col = 0; col < side; col++) {
      if (hexDist(radius, [row, col]) <= radius) cells.push([row, col]);
    }
  }
  return cells;
}

// Copo de nieve 6-simétrico sobre R=6 (~91 celdas): núcleo hexagonal R=2
// (rol core) + 6 brazos dendríticos (rol snow). El brazo "up" se define en
// axiales y se rota 60° cinco veces: rotCW(q,r) = (-r, q+r).
function snowflakeRegions(radius: number): Record<string, Cell[]> {
  const armUp: ReadonlyArray<readonly [number, number]> = [
    // espina dist 3..R
    [0, -3],
    [0, -4],
    [0, -5],
    [0, -6],
    // raíl derecho paralelo a la espina (colineal eje up ⇒ tesela en un
    // segmento) + espejo izquierdo
    [1, -4],
    [1, -5],
    [1, -6],
    [-1, -3],
    [-1, -4],
    [-1, -5],
    // puntas dendríticas laterales en el extremo + espejo
    [2, -6],
    [-2, -4],
  ];
  const core: Cell[] = fullHexCells(radius).filter(
    (c) => hexDist(radius, c) <= 2,
  );
  const snow = new Map<string, Cell>();
  for (let arm = 0; arm < 6; arm++) {
    for (let [q, r] of armUp) {
      for (let i = 0; i < arm; i++) [q, r] = [-r, q + r];
      const cell: Cell = [r + radius, q + radius];
      snow.set(key(cell), cell);
    }
  }
  const rowMajor = (a: Cell, b: Cell) => a[0] - b[0] || a[1] - b[1];
  return {
    core: core.sort(rowMajor),
    snow: [...snow.values()].sort(rowMajor),
  };
}

// ---------------------------------------------------------------------------
// Teselado por inserción inversa
// ---------------------------------------------------------------------------

interface GenArrow {
  cells: Cell[]; // cola → cabeza (convención Arrow del dominio)
  headDir: Dir;
  region?: string;
}

interface GenParams {
  radius: number;
  active: ReadonlyMap<string, Cell>; // celdas jugables (silueta o hex entero)
  regionOf?: ReadonlyMap<string, string>; // los segmentos no cruzan regiones
  maxLen: number;
  rnd: () => number;
}

// Carril de salida desde head: pasos sucesivos DENTRO del espacio activo
// (misma semántica que HexSpace/HexMaskedSpace.exitLane — en masked, salir de
// la silueta ES salir del tablero).
function lane(params: GenParams, head: Cell, dir: Dir): Cell[] {
  const [dr, dc] = DELTAS[dir];
  const out: Cell[] = [];
  let [row, col] = [head[0] + dr, head[1] + dc];
  while (params.active.has(key([row, col]))) {
    out.push([row, col]);
    row += dr;
    col += dc;
  }
  return out;
}

// Inserta segmentos rectos cubriendo las celdas activas de dentro hacia fuera.
// Invariante: al insertar, el carril de la cabeza no toca celdas YA ocupadas
// (las aún libres las cubrirán flechas posteriores, que salen ANTES en la
// solución inversa). Devuelve null si un hueco queda inescapable con esta
// semilla — el llamador reintenta con otra.
function tessellate(params: GenParams): GenArrow[] | null {
  const { radius, active, regionOf, maxLen, rnd } = params;
  const occupied = new Set<string>();
  const uncovered = new Map(active);
  const arrows: GenArrow[] = [];

  const centerOut = (a: Cell, b: Cell) =>
    hexDist(radius, a) - hexDist(radius, b) || rnd() - 0.5;

  while (uncovered.size > 0) {
    const seedCell = [...uncovered.values()].sort(centerOut)[0];
    const [px, py] = pixel(radius, seedCell);
    // Direcciones ordenadas "hacia fuera primero" (producto punto con la
    // posición de la celda): alinea espinas de brazo y despeja carriles.
    const outwardFirst = [...DIRS].sort((a, b) => {
      const da = DELTAS[a];
      const db = DELTAS[b];
      const [ax, ay] = pixel(radius, [
        seedCell[0] + da[0],
        seedCell[1] + da[1],
      ]);
      const [bx, by] = pixel(radius, [
        seedCell[0] + db[0],
        seedCell[1] + db[1],
      ]);
      return (
        (bx - px) * px + (by - py) * py - ((ax - px) * px + (ay - py) * py) ||
        rnd() - 0.5
      );
    });

    let placed = false;
    const sameRegion = (c: Cell) =>
      !regionOf || regionOf.get(key(c)) === regionOf.get(key(seedCell));
    // Dos pasadas: primero solo segmentos ≥2 (legibilidad — menos flechas de
    // una celda); los singles quedan como último recurso.
    for (const minLen of [2, 1]) {
      for (const dir of outwardFirst) {
        // Crece desde la celda semilla hacia dir (cabeza hacia fuera) y luego
        // extiende la cola hacia dentro, siempre por celdas libres de la
        // MISMA región: segmentos largos = niveles legibles.
        const cells: Cell[] = [seedCell];
        const [dr, dc] = DELTAS[dir];
        while (cells.length < maxLen) {
          const last = cells[cells.length - 1];
          const next: Cell = [last[0] + dr, last[1] + dc];
          if (!uncovered.has(key(next)) || !sameRegion(next)) break;
          cells.push(next);
        }
        while (cells.length < maxLen) {
          const first = cells[0];
          const prev: Cell = [first[0] - dr, first[1] - dc];
          if (!uncovered.has(key(prev)) || !sameRegion(prev)) break;
          cells.unshift(prev);
        }
        if (cells.length < minLen) continue;
        const head = cells[cells.length - 1];
        if (lane(params, head, dir).some((c) => occupied.has(key(c)))) continue;
        arrows.push({
          cells,
          headDir: dir,
          region: regionOf?.get(key(seedCell)),
        });
        cells.forEach((c) => {
          occupied.add(key(c));
          uncovered.delete(key(c));
        });
        placed = true;
        break;
      }
      if (placed) break;
    }
    if (!placed) return null;
  }
  return arrows;
}

// ---------------------------------------------------------------------------
// Render ASCII (mismo formato que verify-hex-level.ts) para iterar a ojo
// ---------------------------------------------------------------------------

const GLYPHS = '0123456789abcdefghijklmnopqrstuvwxyz';

function renderAscii(fixture: LevelFixture): string {
  const r = fixture.space?.radius ?? 0;
  const occ = new Map<string, number>();
  fixture.arrows.forEach((a, i) =>
    a.cells.forEach(([row, col]) => occ.set(`${row},${col}`, i)),
  );
  const activeCells = new Set<string>(
    fixture.silhouette === undefined
      ? fullHexCells(r).map(key)
      : Object.values(fixture.silhouette).flatMap((cells) =>
          cells.map(([row, col]) => `${row},${col}`),
        ),
  );
  const lines: string[] = [];
  for (let row = 0; row <= 2 * r; row++) {
    let line = ' '.repeat(row);
    for (let col = 0; col <= 2 * r; col++) {
      if (hexDist(r, [row, col]) > r) {
        line += '  ';
        continue;
      }
      const k = `${row},${col}`;
      if (occ.has(k)) line += GLYPHS[occ.get(k)! % 36] + ' ';
      else line += (activeCells.has(k) ? '·' : '×') + ' ';
    }
    lines.push(line.replace(/\s+$/, ''));
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function run(): void {
  const figure = arg('figure', 'free');
  const radius = Number(arg('radius', figure === 'snowflake' ? '6' : '5'));
  const id = arg(
    'id',
    figure === 'snowflake' ? 't-snowflake' : `hex-0${radius - 2}`,
  )!;
  const baseSeed = Number(arg('seed', '1'));
  const fill = Number(arg('fill', '0.95'));
  const maxLen = Number(arg('max-len', figure === 'snowflake' ? '4' : '5'));
  const dry = process.argv.includes('--dry');

  const regions = figure === 'snowflake' ? snowflakeRegions(radius) : undefined;

  // Explora semillas derivadas y se queda con el teselado más legible (menos
  // flechas): el generador es barato y el solver es el juez final.
  let best: { fixture: LevelFixture; activeCount: number } | null = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const rnd = mulberry32(baseSeed * 1000 + attempt);
    let active: Cell[];
    const regionOf = new Map<string, string>();
    if (regions) {
      active = Object.values(regions).flat();
      for (const [role, cells] of Object.entries(regions))
        cells.forEach((c) => regionOf.set(key(c), role));
    } else {
      // Nivel libre: agujeros dispersos hasta la densidad pedida.
      active = shuffled(fullHexCells(radius), rnd).slice(
        0,
        Math.round(fullHexCells(radius).length * fill),
      );
    }
    const activeMap = new Map(active.map((c) => [key(c), c] as const));
    const arrows = tessellate({
      radius,
      active: activeMap,
      regionOf: regions ? regionOf : undefined,
      maxLen,
      rnd,
    });
    if (arrows === null) continue;

    const fixture: LevelFixture = {
      levelId: id,
      section: figure === 'snowflake' ? 'themed' : 'hex',
      cols: 2 * radius + 1,
      rows: 2 * radius + 1,
      timeLimitSec: suggestTimeLimitSec(arrows.length),
      space: { type: 'hex', radius },
      ...(figure === 'snowflake'
        ? {
            palette: { core: '#3B82F6', snow: '#E8F4FF' },
            silhouette: Object.fromEntries(
              Object.entries(regions!).map(([role, cells]) => [
                role,
                cells.map(([row, col]) => [row, col]),
              ]),
            ),
          }
        : {}),
      arrows: arrows.map((a, i) => ({
        id: `arrow-${i}`,
        headDir: a.headDir,
        cells: a.cells.map(([row, col]) => [row, col]),
        ...(a.region !== undefined ? { paintRole: a.region } : {}),
      })),
    };

    let solution: ReturnType<LevelSolver['solve']>;
    try {
      validateLevelSilhouette(fixture);
      validateLevelPaint(fixture);
      solution = new LevelSolver().solve(buildLevelFromFixture(fixture));
    } catch (e) {
      console.error(`attempt ${attempt}: ${(e as Error).message}`);
      continue;
    }
    if (solution === null || solution.length !== fixture.arrows.length)
      continue;
    if (best === null || fixture.arrows.length < best.fixture.arrows.length)
      best = { fixture, activeCount: active.length };
  }

  if (best === null) {
    console.error('EXHAUSTED: ninguna semilla derivada teseló + resolvió.');
    process.exit(1);
  }
  const { fixture, activeCount } = best;
  console.log(
    `Level: ${id}  figure=${figure}  R=${radius}  seed=${baseSeed}\n` +
      `celdas=${activeCount}/${fullHexCells(radius).length}  ` +
      `arrows=${fixture.arrows.length}  timeLimitSec=${fixture.timeLimitSec}`,
  );
  console.log(renderAscii(fixture));
  if (!dry) {
    const out = path.resolve('prisma/levels', `${id}.json`);
    fs.writeFileSync(out, JSON.stringify(fixture, null, 2) + '\n');
    console.log(`written: ${out}`);
  }
}

run();
