import { Prisma, PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { LevelBuilder } from '../src/domain/entities/level.builder';
import { LevelSolver } from '../src/domain/services/level-solver';
import { LevelId } from '../src/domain/value-objects/level-id.vo';
import type { ArrowPrimitives } from '../src/domain/entities/arrow.factory';

// Seed de los 15 niveles curados (back#10, ADR 0001 dec. 5). Los fixtures en
// prisma/levels/ son la única fuente: cada uno es el superset declarativo de
// Level.data con las columnas de tabla (levelId, order) izadas al nivel raíz.
// Ver prisma/levels/manifest.md para la procedencia y la regla de selección.
interface LevelFixture {
  levelId: string;
  order: number;
  cols: number;
  rows: number;
  timeLimitSec?: number;
  arrows: ArrowPrimitives[];
}

const LEVELS_DIR = path.join(__dirname, 'levels');
const solver = new LevelSolver();

// Carga los fixtures level-NN.json (ignora manifest.md) ordenados por `order`,
// el orden de juego con que se siembran.
function loadFixtures(): LevelFixture[] {
  return fs
    .readdirSync(LEVELS_DIR)
    .filter((file) => /^level-\d+\.json$/.test(file))
    .map(
      (file) =>
        JSON.parse(
          fs.readFileSync(path.join(LEVELS_DIR, file), 'utf8'),
        ) as LevelFixture,
    )
    .sort((a, b) => a.order - b.order);
}

// Guardrail fail-fast (ADR 0001 dec. 8): reconstruye el Level vía LevelBuilder
// —que revalida las invariantes de tablero (in-bounds, sin solape, ids únicos)
// y de flecha— y exige que LevelSolver lo declare soluble. Lanza a la primera
// violación para no sembrar jamás un lote inválido.
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
}

// Forma persistida en Level.data (CONTEXT-MAP.md, wire contract). Excluye
// levelId/order a propósito: son columnas de tabla, no van dentro de `data`,
// o PrismaLevelRepository.toDomain leería una forma equivocada.
function toData(fixture: LevelFixture): Prisma.InputJsonValue {
  return {
    cols: fixture.cols,
    rows: fixture.rows,
    ...(fixture.timeLimitSec !== undefined
      ? { timeLimitSec: fixture.timeLimitSec }
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
      await prisma.level.upsert({
        where: { id: fixture.levelId },
        update: { order: fixture.order, data },
        create: { id: fixture.levelId, order: fixture.order, data },
      });
      console.log(`seeded ${fixture.levelId} (order ${fixture.order})`);
    }
    console.log(`Seed complete: ${fixtures.length} curated levels.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
