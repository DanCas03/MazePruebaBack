// Herramienta puntual de autoría (back#60): NO producto. Carga un fixture
// candidato, lo resuelve con LevelSolver (sin BD) y reporta resolubilidad,
// longitud de solución, timeLimitSec sugerido y un render ASCII del hexágono
// para iterar la autoría a mano. Uso:
//   npx ts-node scripts/verify-hex-level.ts prisma/levels/hex-01.json
import * as fs from 'fs';
import * as path from 'path';
import { LevelSolver } from '../src/domain/services/level-solver';
import { Level } from '../src/domain/entities/level.entity';
import {
  LevelFixture,
  buildLevelFromFixture,
  suggestTimeLimitSec,
} from '../src/infrastructure/database/level-fixture';

const GLYPHS = '0123456789abcdefghijklmnopqrstuvwxyz';

function renderHex(fixture: LevelFixture): string {
  const r = fixture.space?.radius ?? 0;
  if (r <= 0) return '(no hex space to render)';
  const occ = new Map<string, number>();
  fixture.arrows.forEach((a, i) =>
    a.cells.forEach(([row, col]) => occ.set(`${row},${col}`, i)),
  );
  const inside = (row: number, col: number): boolean => {
    const q = col - r;
    const rr = row - r;
    return Math.abs(q) <= r && Math.abs(rr) <= r && Math.abs(q + rr) <= r;
  };
  const active = (row: number, col: number): boolean => {
    if (fixture.silhouette === undefined) return inside(row, col);
    return Object.values(fixture.silhouette).some((cells) =>
      cells.some(([cr, cc]) => cr === row && cc === col),
    );
  };
  const lines: string[] = [];
  for (let row = 0; row <= 2 * r; row++) {
    let line = ' '.repeat(row); // sangría cruda para la silueta flat-top
    for (let col = 0; col <= 2 * r; col++) {
      if (!inside(row, col)) {
        line += '  ';
        continue;
      }
      const key = `${row},${col}`;
      if (occ.has(key)) line += GLYPHS[occ.get(key)! % 36] + ' ';
      else line += (active(row, col) ? '·' : '×') + ' ';
    }
    lines.push(line.replace(/\s+$/, ''));
  }
  return lines.join('\n');
}

function run(): void {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: ts-node scripts/verify-hex-level.ts <path-to-level.json>');
    process.exit(2);
  }
  const fixture = JSON.parse(
    fs.readFileSync(path.resolve(arg), 'utf8'),
  ) as LevelFixture;

  let level: Level;
  try {
    level = buildLevelFromFixture(fixture);
  } catch (e) {
    console.error(`BUILD FAILED for ${fixture.levelId}: ${(e as Error).message}`);
    process.exit(1);
  }

  console.log(
    `Level: ${fixture.levelId}  section=${fixture.section ?? 'campaign'}  ` +
      `space=${fixture.space ? `hex R=${fixture.space.radius}` : 'rect'}  ` +
      `arrows=${fixture.arrows.length}`,
  );
  console.log(renderHex(fixture));

  const solution = new LevelSolver().solve(level);
  if (solution === null) {
    console.log('SOLVABLE: NO  — el solver no encontró orden de salida.');
    process.exit(1);
  }
  console.log(`SOLVABLE: YES  solutionLength=${solution.length}`);
  console.log(
    `Suggested timeLimitSec = ${suggestTimeLimitSec(solution.length)} ` +
      `(max(30, round5(len*4.5)))`,
  );
  console.log(`Order: ${solution.map((a) => a.value).join(' -> ')}`);
}

run();
