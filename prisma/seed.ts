import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { LevelSolver } from '../src/domain/services/level-solver';
import { validateLevelPaint } from '../src/infrastructure/database/level-paint.validator';
import { validateLevelSilhouette } from '../src/infrastructure/database/level-silhouette.validator';
import {
  LEVEL_FIXTURE_FILENAME_PATTERN,
  LevelFixture,
  buildLevelFromFixture,
  fixtureToData,
  resolveSection,
} from '../src/infrastructure/database/level-fixture';

// Seed del catálogo de niveles: los 15 curados de campaña (back#10, ADR 0001
// dec. 5) más los temáticos (back#31, ADR 0004) y los hexagonales (back#60,
// ADR-0007). Los fixtures en prisma/levels/ son la única fuente: cada uno es
// el superset declarativo de Level.data con las columnas de tabla (levelId,
// order, section) izadas al nivel raíz. Ver prisma/levels/manifest.md para
// la procedencia.
//
// Campaña: order contiguo 1..15, sin section (default campaign).
// Temáticos: section "themed", sin order (null en la tabla), con
// Instrucciones de pintado opcionales (palette + paintRole por flecha) y
// máscara de silueta opcional (silhouette, back#53).
// Hexagonales: section "hex", sin order, geometría descrita por `space`
// (back#60).

const LEVELS_DIR = path.join(__dirname, 'levels');
const solver = new LevelSolver();

// Carga los fixtures level-NN.json (campaña) y t-*.json (temáticos), ignora
// manifest.md. Orden de siembra = orden de catálogo: campaña por `order`,
// luego temáticos por levelId.
function loadFixtures(): LevelFixture[] {
  return fs
    .readdirSync(LEVELS_DIR)
    .filter((file) => LEVEL_FIXTURE_FILENAME_PATTERN.test(file))
    .map(
      (file) =>
        JSON.parse(
          fs.readFileSync(path.join(LEVELS_DIR, file), 'utf8'),
        ) as LevelFixture,
    )
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.levelId.localeCompare(b.levelId);
    });
}

// Guardrail fail-fast (ADR 0001 dec. 8): reconstruye el Level vía LevelBuilder
// —que revalida las invariantes de tablero (in-bounds, sin solape, ids únicos)
// y de flecha— y exige que LevelSolver lo declare soluble. La invariante
// aplica igual a los temáticos (ADR 0004: son Level como cualquier otro).
// Además, chequeo barato de las Instrucciones de pintado (roles existentes,
// hex #RRGGBB) y de la máscara de silueta (regiones con palette, celdas
// in-bounds sin duplicar ni solapar, flechas dentro de la unión) — la única
// validación de esa metadata en todo el back.
// Lanza a la primera violación para no sembrar jamás un lote inválido.
function validate(fixture: LevelFixture): void {
  const level = buildLevelFromFixture(fixture);
  if (!solver.isSolvable(level)) {
    throw new Error(
      `Level ${fixture.levelId} is not solvable — refusing to seed.`,
    );
  }
  validateLevelPaint(fixture);
  validateLevelSilhouette(fixture);
}

async function main(): Promise<void> {
  const fixtures = loadFixtures();
  if (fixtures.length === 0) {
    throw new Error(`No level fixtures found in ${LEVELS_DIR}`);
  }

  // Paso 1: validar TODO el lote antes de escribir nada (fail-fast).
  fixtures.forEach(validate);

  const prisma = new PrismaClient();
  try {
    // Paso 2: upsert idempotente por id. Preserva los ids referenciados por
    // ScoreEntry/Progress y permite re-sembrar sin duplicar (ADR 0001 dec. 7).
    for (const fixture of fixtures) {
      const data = fixtureToData(fixture);
      const order = fixture.order ?? null;
      const section = resolveSection(fixture);
      await prisma.level.upsert({
        where: { id: fixture.levelId },
        update: { order, section, data },
        create: { id: fixture.levelId, order, section, data },
      });
      console.log(
        `seeded ${fixture.levelId} (${section}${
          order !== null ? `, order ${order}` : ''
        })`,
      );
    }
    console.log(`Seed complete: ${fixtures.length} levels.`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}
