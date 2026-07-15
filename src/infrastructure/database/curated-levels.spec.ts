import * as fs from 'fs';
import * as path from 'path';
import { LevelBuilder } from '../../domain/entities/level.builder';
import { LevelSolver } from '../../domain/services/level-solver';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { validateLevelPaint } from './level-paint.validator';
import type { ArrowPrimitives } from '../../domain/entities/arrow.factory';

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
// Instrucciones de pintado opcionales servidas como datos opacos.
interface ThemedLevelFixture {
  levelId: string;
  section: string;
  cols: number;
  rows: number;
  timeLimitSec?: number;
  palette?: Record<string, string>;
  arrows: (ArrowPrimitives & { paintRole?: string })[];
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
  const builder = new LevelBuilder(new LevelId(fixture.levelId))
    .withDimensions(fixture.cols, fixture.rows)
    .withTimeLimit(fixture.timeLimitSec);
  fixture.arrows.forEach((arrow) => builder.addArrow(arrow));
  return builder.build();
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
      // Rampa back#32 (ADR 0003): el tier 5 abarca DOS bandas de tablero — el
      // par regular (42x46) y el finale (50x50) — asi que agrupar por dims da
      // 6 bandas, no 5.
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
      // Act + Assert — la rampa back#32 sube la carga de flechas de forma
      // GLOBAL (6->13->36->94->163->166->216), no solo dentro de cada banda de
      // dims: fija el escalon transversal de dificultad que las bandas de
      // conteo constante (T1..T4) no llegan a ejercer.
      for (let i = 1; i < fixtures.length; i++) {
        expect(fixtures[i].arrows.length).toBeGreaterThanOrEqual(
          fixtures[i - 1].arrows.length,
        );
      }
    });
  });

  describe('time limits', () => {
    // Rampa back#32 (ADR 0003): se juega sin reloj hasta que la dificultad lo
    // justifica. Orders 1..6 (6x8 y 10x12) van sin timeLimitSec; a partir del
    // tier medio (order 7, 18x20) todos llevan cronometro alineado a 30s.
    const untimed = fixtures.filter((f) => f.order <= 6);
    const timed = fixtures.filter((f) => f.order >= 7);

    it.each(untimed.map((f) => [f.levelId, f] as const))(
      'should omit timeLimitSec on early level %s (orders 1..6)',
      (_levelId, fixture) => {
        // Assert
        expect(fixture.timeLimitSec).toBeUndefined();
      },
    );

    it.each(timed.map((f) => [f.levelId, f] as const))(
      'should set a positive, 30s-aligned timeLimitSec on timed level %s (orders 7..15)',
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

    it('should keep timeLimitSec non-decreasing across play order when both defined', () => {
      // Act + Assert — los relojes crecen con la rampa (150 -> 390 -> 690 -> 930):
      // para fixtures consecutivos con reloj, el posterior nunca es menor.
      for (let i = 1; i < fixtures.length; i++) {
        const prev = fixtures[i - 1].timeLimitSec;
        const curr = fixtures[i].timeLimitSec;
        if (prev !== undefined && curr !== undefined) {
          expect(curr).toBeGreaterThanOrEqual(prev);
        }
      }
    });
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

    it('should ship the 3 themed figures (front#68) as themed fixtures without play order', () => {
      // Arrange — figuras temáticas producidas por el tooling del front (ADR
      // 0004: mínimo 3), sustituyen al placeholder t-smoke.
      const expectedIds = ['t-bunny', 't-happy-face', 't-heart'];
      // Act
      const ids = themed.map((f) => f.levelId);
      // Assert
      expect(ids).toEqual(expectedIds);
      themed.forEach((fixture) => {
        expect(fixture.section).toBe('themed');
        expect(fixture).not.toHaveProperty('order');
        expect(fixture).not.toHaveProperty('timeLimitSec');
      });
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

    it('should keep every campaign fixture free of paint metadata', () => {
      // Act + Assert — la campaña no cambia de semántica (retro-compat).
      fixtures.forEach((fixture) => {
        expect(fixture).not.toHaveProperty('palette');
        fixture.arrows.forEach((arrow) => {
          expect(arrow).not.toHaveProperty('paintRole');
        });
      });
    });
  });
});
