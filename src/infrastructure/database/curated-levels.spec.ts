import * as fs from 'fs';
import * as path from 'path';
import { LevelSolver } from '../../domain/services/level-solver';
import { validateLevelPaint } from './level-paint.validator';
import { validateLevelSilhouette } from './level-silhouette.validator';
import type { ArrowPrimitives } from '../../domain/entities/arrow.factory';
import { buildLevelFromFixture } from './level-fixture';

// Contrato de los fixtures curados (back#10, ADR 0001 dec. 5): los 15 niveles
// que prisma/seed.ts siembra en Postgres. La spec valida los fixtures como
// datos (sin DB), reconstruyendolos por el mismo camino que el seed y el
// repositorio: LevelBuilder + LevelSolver. Verifica (a) que todos son solubles,
// (b) la rampa de dificultad y (c) los limites de tiempo por tier.
interface LevelFixture {
  levelId: string;
  order: number;
  cols: number;
  rows: number;
  timeLimitSec?: number;
  arrows: ArrowPrimitives[];
}

// Fixture temático (back#31, ADR 0004): sin order, con section y con
// Instrucciones de pintado opcionales servidas como datos opacos. back#53
// añade `silhouette` — mismo portador opaco que `Level.silhouette`
// (LevelSilhouette), validado solo estructuralmente por
// `validateLevelSilhouette`.
interface ThemedLevelFixture {
  levelId: string;
  section: string;
  cols: number;
  rows: number;
  timeLimitSec?: number;
  palette?: Record<string, string>;
  silhouette?: Record<string, number[][]>;
  arrows: (ArrowPrimitives & { paintRole?: string })[];
}

// Cobertura de flechas sobre la unión de la silueta: mismo cálculo que el
// guardián de densidad del front (front task 7,
// graph_board_themed_dense_test.dart) — celdas de flecha distintas dentro de
// la unión de todas las regiones de `silhouette`, dividido por el tamaño de
// esa unión. `validateLevelSilhouette` ya garantiza que ninguna celda de
// flecha cae fuera de la unión, así que el numerador es simplemente el
// tamaño del conjunto de celdas de flecha.
function silhouetteCoverage(fixture: ThemedLevelFixture): number {
  const union = new Set<string>();
  Object.values(fixture.silhouette ?? {}).forEach((cells) =>
    cells.forEach(([row, col]) => union.add(`${row},${col}`)),
  );
  const covered = new Set<string>();
  fixture.arrows.forEach((arrow) =>
    arrow.cells.forEach(([row, col]) => covered.add(`${row},${col}`)),
  );
  return covered.size / union.size;
}

// Los fixtures viven en prisma/levels, fuera de rootDir=src. Jest corre desde
// la raiz del repo, asi que process.cwd() apunta ahi.
const LEVELS_DIR = path.join(process.cwd(), 'prisma', 'levels');

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

function loadThemedFixtures(): ThemedLevelFixture[] {
  return fs
    .readdirSync(LEVELS_DIR)
    .filter((file) => /^t-[a-z0-9-]+\.json$/.test(file))
    .map(
      (file) =>
        JSON.parse(
          fs.readFileSync(path.join(LEVELS_DIR, file), 'utf8'),
        ) as ThemedLevelFixture,
    )
    .sort((a, b) => a.levelId.localeCompare(b.levelId));
}

function buildLevel(fixture: LevelFixture | ThemedLevelFixture) {
  // Camino único de construcción (back#60): delega en el módulo compartido
  // `buildLevelFromFixture` para que se apliquen `space`/`section`/`silhouette`
  // — así los fixtures hexagonales (p. ej. t-snowflake) se construyen sobre
  // HexMaskedSpace y no sobre RectSpace, donde sus headDir diagonales lanzarían.
  return buildLevelFromFixture(fixture);
}

describe('curated levels (back#10 seed fixtures)', () => {
  const solver = new LevelSolver();
  const fixtures = loadFixtures();

  it('should freeze exactly 15 curated level fixtures', () => {
    // Arrange + Act — carga en loadFixtures()
    // Assert
    expect(fixtures).toHaveLength(15);
  });

  describe('solvability', () => {
    it.each(fixtures.map((fixture) => [fixture.levelId, fixture] as const))(
      'should build %s and prove it solvable with LevelSolver',
      (_levelId, fixture) => {
        // Arrange
        const level = buildLevel(fixture);
        // Act
        const solvable = solver.isSolvable(level);
        // Assert
        expect(solvable).toBe(true);
      },
    );
  });

  describe('difficulty ramp', () => {
    it('should expose ids level-01..level-15 in play order', () => {
      // Arrange
      const expected = Array.from(
        { length: 15 },
        (_, i) => `level-${String(i + 1).padStart(2, '0')}`,
      );
      // Act
      const ids = fixtures.map((fixture) => fixture.levelId);
      // Assert
      expect(ids).toEqual(expected);
    });

    it('should assign unique, contiguous order 1..15', () => {
      // Arrange
      const expected = Array.from({ length: 15 }, (_, i) => i + 1);
      // Act
      const orders = fixtures.map((fixture) => fixture.order);
      // Assert
      expect(orders).toEqual(expected);
    });

    it('should number each levelId to match its order', () => {
      // Act + Assert
      fixtures.forEach((fixture) => {
        const numberInId = parseInt(fixture.levelId.split('-')[1], 10);
        expect(numberInId).toBe(fixture.order);
      });
    });

    it('should never shrink board dimensions as order increases', () => {
      // Act + Assert
      for (let i = 1; i < fixtures.length; i++) {
        expect(fixtures[i].cols).toBeGreaterThanOrEqual(fixtures[i - 1].cols);
        expect(fixtures[i].rows).toBeGreaterThanOrEqual(fixtures[i - 1].rows);
      }
    });

    it('should never shrink arrow count within a tier (same dimensions)', () => {
      // Arrange — agrupar por dims: cada banda comparte un unico cols x rows.
      // Rampa back#46 (reshape 9:16): el tier 5 abarca DOS bandas de tablero —
      // el par regular (25x44) y el finale (28x50) — asi que agrupar por dims
      // da 6 bandas, no 5.
      const byTier = new Map<string, LevelFixture[]>();
      fixtures.forEach((fixture) => {
        const key = `${fixture.cols}x${fixture.rows}`;
        byTier.set(key, [...(byTier.get(key) ?? []), fixture]);
      });
      // Act + Assert
      expect(byTier.size).toBe(6);
      byTier.forEach((tier) => {
        const ordered = [...tier].sort((a, b) => a.order - b.order);
        for (let i = 1; i < ordered.length; i++) {
          expect(ordered[i].arrows.length).toBeGreaterThanOrEqual(
            ordered[i - 1].arrows.length,
          );
        }
      });
    });

    it('should never shrink arrow count across the whole play order (cross-tier ramp)', () => {
      // Act + Assert — la rampa back#46 sube la carga de flechas de forma
      // GLOBAL (7->16->26->67->118->180), no solo dentro de cada banda de
      // dims: fija el escalon transversal de dificultad que las bandas de
      // conteo constante (T1..T4) no llegan a ejercer.
      for (let i = 1; i < fixtures.length; i++) {
        expect(fixtures[i].arrows.length).toBeGreaterThanOrEqual(
          fixtures[i - 1].arrows.length,
        );
      }
    });

    it('should match the exact per-level arrow count ramp (back#46, 9:16 reshape)', () => {
      // Arrange — 6 bandas de dims (3+3+3+3+2+1 niveles), rampa 7->16->26->
      // 67->118->180 leida de los fixtures copiados (Task 5 staging).
      const expected = [
        7, 7, 7, 16, 16, 16, 26, 26, 26, 67, 67, 67, 118, 118, 180,
      ];
      // Act
      const arrowCounts = fixtures.map((fixture) => fixture.arrows.length);
      // Assert
      expect(arrowCounts).toEqual(expected);
    });
  });

  describe('time limits', () => {
    // Rampa back#46 (reshape 9:16): TODOS los 15 niveles llevan reloj ahora.
    // La rampa previa (back#32) dejaba las orders 1..6 sin timeLimitSec; esta
    // reshape arranca el cronometro ya en el opener (30s) y escala por tier:
    // 30,30,30,90,90,90,120,120,120,270,270,270,480,480,720.
    const EXPECTED_TIME_LIMITS = [
      30, 30, 30, 90, 90, 90, 120, 120, 120, 270, 270, 270, 480, 480, 720,
    ];

    it.each(fixtures.map((f) => [f.levelId, f] as const))(
      'should set a positive, 30s-aligned timeLimitSec on every level %s',
      (_levelId, fixture) => {
        // Arrange
        const time = fixture.timeLimitSec;
        // Assert — reloj definido, entero positivo y multiplo de 30s (>= 30).
        expect(time).toBeDefined();
        expect(Number.isInteger(time)).toBe(true);
        expect(time as number).toBeGreaterThan(0);
        expect(time as number).toBeGreaterThanOrEqual(30);
        expect((time as number) % 30).toBe(0);
      },
    );

    it('should match the exact per-tier timeLimitSec ramp', () => {
      // Act
      const timeLimits = fixtures.map((fixture) => fixture.timeLimitSec);
      // Assert
      expect(timeLimits).toEqual(EXPECTED_TIME_LIMITS);
    });

    it('should keep timeLimitSec non-decreasing across play order', () => {
      // Act + Assert — los relojes crecen con la rampa; el posterior nunca es
      // menor que el previo (ahora los 15 fixtures llevan reloj definido).
      for (let i = 1; i < fixtures.length; i++) {
        const prev = fixtures[i - 1].timeLimitSec as number;
        const curr = fixtures[i].timeLimitSec as number;
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });
  });

  describe('aspect band (back#46, 9:16 reshape)', () => {
    // AspectBand vive en el front (Dart) como fuente de verdad —
    // MazePruebaFront/lib/domain/arrows/value_objects/aspect_band.dart
    // (minRatio 0.53, maxRatio 0.68, targetRatio 0.5625). Este repo no puede
    // importar Dart, asi que la banda se restablece aqui como constante local
    // documentada; mantener en sync manualmente si esa VO cambia.
    const ASPECT_BAND = { min: 0.53, max: 0.68 } as const;

    it.each(fixtures.map((f) => [f.levelId, f] as const))(
      'should keep %s within the 9:16 aspect band [0.53, 0.68]',
      (_levelId, fixture) => {
        // Act
        const ratio = fixture.cols / fixture.rows;
        // Assert
        expect(ratio).toBeGreaterThanOrEqual(ASPECT_BAND.min);
        expect(ratio).toBeLessThanOrEqual(ASPECT_BAND.max);
      },
    );
  });

  // back#32 (QA brief): proxy sin DB para "npx prisma db seed" < 10 s.
  // Reconstruye los 15 fixtures por el mismo camino que el seed (LevelBuilder)
  // y prueba cada uno soluble con LevelSolver, midiendo el presupuesto total.
  describe('seed time budget', () => {
    it('should build and prove all 15 fixtures solvable well under the 10s seed budget', () => {
      // Arrange
      const started = Date.now();
      // Act — reconstruir y validar cada nivel como lo hace el seed.
      const allSolvable = fixtures.every((fixture) =>
        solver.isSolvable(buildLevel(fixture)),
      );
      const elapsedMs = Date.now() - started;
      // Assert — cada nivel soluble y presupuesto total holgado frente a Prisma.
      expect(allSolvable).toBe(true);
      expect(elapsedMs).toBeLessThan(10000);
    });
  });

  // Sección temática (back#31, ADR 0004): mismos guardrails de tablero y
  // solubilidad que la campaña, más el chequeo barato de pintado del seed.
  describe('themed fixtures', () => {
    const themed = loadThemedFixtures();

    it('should ship the front#68 figures plus t-snowflake (back#60) as themed fixtures without play order', () => {
      // Arrange — 3 figuras temáticas del tooling del front (ADR 0004, front#68)
      // + t-snowflake, el temático hexagonal enmascarado de back#60 (ADR-0007).
      const expectedIds = ['t-bunny', 't-happy-face', 't-heart', 't-snowflake'];
      // Act
      const ids = themed.map((f) => f.levelId);
      // Assert
      expect(ids).toEqual(expectedIds);
      themed.forEach((fixture) => {
        expect(fixture.section).toBe('themed');
        expect(fixture).not.toHaveProperty('order');
      });
      // Las figuras front#68 son sin cronómetro; t-snowflake SÍ lleva
      // `timeLimitSec` explícito (back#60 D6/D7: el temático hex es cronometrado).
      themed
        .filter((fixture) => fixture.levelId !== 't-snowflake')
        .forEach((fixture) =>
          expect(fixture).not.toHaveProperty('timeLimitSec'),
        );
      expect(
        themed.find((fixture) => fixture.levelId === 't-snowflake')
          ?.timeLimitSec,
      ).toBe(45);
    });

    it.each(themed.map((fixture) => [fixture.levelId, fixture] as const))(
      'should build %s, prove it solvable and pass the paint consistency check',
      (_levelId, fixture) => {
        // Arrange
        const level = buildLevel(fixture);
        // Act
        const solvable = solver.isSolvable(level);
        const paintCheck = () => validateLevelPaint(fixture);
        // Assert
        expect(solvable).toBe(true);
        expect(paintCheck).not.toThrow();
      },
    );

    // back#53: los 3 fixtures temáticos llevan silhouette y
    // validateLevelSilhouette los acepta (chequeo estructural barato, sin
    // semántica visual — ver level-silhouette.validator.ts).
    it.each(themed.map((fixture) => [fixture.levelId, fixture] as const))(
      'should carry a silhouette on %s that validateLevelSilhouette accepts',
      (_levelId, fixture) => {
        // Arrange
        const check = () => validateLevelSilhouette(fixture);
        // Assert
        expect(fixture.silhouette).toBeDefined();
        expect(check).not.toThrow();
      },
    );

    // Guardián de densidad (espejo del front, back#53): t-heart y
    // t-happy-face se regeneraron densos — la cobertura de flechas sobre la
    // unión de la silueta debe superar el mismo umbral 0.90 que usa el
    // tooling del front al elegir seed. Valores medidos sobre los datos
    // reales sembrados (no asumidos): heart 0.9885, happy_face 0.9796.
    describe('density guardian over the real silhouette union', () => {
      const DENSITY_THRESHOLD = 0.9;
      const guarded = themed.filter((f) => f.levelId !== 't-bunny');

      it.each(guarded.map((fixture) => [fixture.levelId, fixture] as const))(
        'should cover the %s silhouette union with at least 0.90 arrow density',
        (_levelId, fixture) => {
          // Act
          const coverage = silhouetteCoverage(fixture);
          // Assert
          expect(coverage).toBeGreaterThanOrEqual(DENSITY_THRESHOLD);
        },
      );
    });

    // t-bunny es el benchmark estético congelado (back#47): esta tarea solo
    // le añade `silhouette` — sus flechas quedan byte-idénticas, sin pasar
    // por el guardián de densidad de arriba.
    it('should keep t-bunny frozen at exactly 37 arrows', () => {
      // Arrange
      const bunny = themed.find((fixture) => fixture.levelId === 't-bunny');
      // Act + Assert
      expect(bunny).toBeDefined();
      expect(bunny?.arrows).toHaveLength(37);
    });

    it('should keep every campaign fixture free of paint and silhouette metadata', () => {
      // Act + Assert — la campaña no cambia de semántica (retro-compat).
      fixtures.forEach((fixture) => {
        expect(fixture).not.toHaveProperty('palette');
        expect(fixture).not.toHaveProperty('silhouette');
        fixture.arrows.forEach((arrow) => {
          expect(arrow).not.toHaveProperty('paintRole');
        });
      });
    });
  });
});
