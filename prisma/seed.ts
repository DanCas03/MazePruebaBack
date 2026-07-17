import { Prisma, PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { LevelBuilder } from '../src/domain/entities/level.builder';
import { LevelSolver } from '../src/domain/services/level-solver';
import { LevelId } from '../src/domain/value-objects/level-id.vo';
import { validateLevelPaint } from '../src/infrastructure/database/level-paint.validator';
import type { ArrowPrimitives } from '../src/domain/entities/arrow.factory';

// Seed del catálogo de niveles: los 15 curados de campaña (back#10, ADR 0001
// dec. 5) más los temáticos (back#31, ADR 0004). Los fixtures en
// prisma/levels/ son la única fuente: cada uno es el superset declarativo de
// Level.data con las columnas de tabla (levelId, order, section) izadas al
// nivel raíz. Ver prisma/levels/manifest.md para la procedencia.
//
// Campaña: order contiguo 1..15, sin section (default campaign).
// Temáticos: section "themed", sin order (null en la tabla), con
// Instrucciones de pintado opcionales (palette + paintRole por flecha).
interface LevelFixture {
  levelId: string;
  order?: number;
  section?: string;
  cols: number;
  rows: number;
  timeLimitSec?: number;
  palette?: Record<string, string>;
  // silhouette: máscara opaca por rol temático (celdas [row,col] de la
  // región); el back solo valida forma (roles ⊆ palette, in-bounds) — ver
  // validateLevelPaint. Nunca interpreta la semántica visual.
  silhouette?: Record<string, [number, number][]>;
  arrows: (ArrowPrimitives & { paintRole?: string })[];
}

const LEVELS_DIR = path.join(__dirname, 'levels');
const solver = new LevelSolver();

// Carga los fixtures level-NN.json (campaña) y t-*.json (temáticos), ignora
// manifest.md. Orden de siembra = orden de catálogo: campaña por `order`,
// luego temáticos por levelId.
function loadFixtures(): LevelFixture[] {
  return fs
    .readdirSync(LEVELS_DIR)
    .filter((file) => /^(level-\d+|t-[a-z0-9-]+)\.json$/.test(file))
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
// hex #RRGGBB) — la única validación de esa metadata en todo el back.
// Lanza a la primera violación para no sembrar jamás un lote inválido.
function validate(fixture: LevelFixture): void {
  const builder = new LevelBuilder(new LevelId(fixture.levelId))
    .withDimensions(fixture.cols, fixture.rows)
    .withTimeLimit(fixture.timeLimitSec);
  fixture.arrows.forEach((arrow) => builder.addArrow(arrow));
  const level = builder.build();
  if (!solver.isSolvable(level)) {
    throw new Error(
      `Level ${fixture.levelId} is not solvable — refusing to seed.`,
    );
  }
  validateLevelPaint(fixture);
}

// Forma persistida en Level.data (CONTEXT-MAP.md, wire contract). Excluye
// levelId/order/section a propósito: son columnas de tabla, no van dentro de
// `data`, o PrismaLevelRepository.toDomain leería una forma equivocada.
// palette, paintRole (dentro de cada arrow) y silhouette SÍ van en data: son
// parte del JSON del nivel que el repositorio iza al portador paint (ADR 0004).
function toData(fixture: LevelFixture): Prisma.InputJsonValue {
  return {
    cols: fixture.cols,
    rows: fixture.rows,
    ...(fixture.timeLimitSec !== undefined
      ? { timeLimitSec: fixture.timeLimitSec }
      : {}),
    ...(fixture.palette !== undefined ? { palette: fixture.palette } : {}),
    ...(fixture.silhouette !== undefined
      ? { silhouette: fixture.silhouette }
      : {}),
    // Los fixtures son JSON por construcción; el cast salva solo la fricción
    // de tipos entre la interfaz ArrowPrimitives y el JSON de entrada de Prisma.
    arrows: fixture.arrows as unknown as Prisma.InputJsonArray,
  };
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
      const data = toData(fixture);
      const order = fixture.order ?? null;
      const section = fixture.section === 'themed' ? 'themed' : 'campaign';
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

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
