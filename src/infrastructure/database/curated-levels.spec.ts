import * as fs from 'fs';
import * as path from 'path';
import { LevelBuilder } from '../../domain/entities/level.builder';
import { LevelSolver } from '../../domain/services/level-solver';
import { LevelId } from '../../domain/value-objects/level-id.vo';
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

function buildLevel(fixture: LevelFixture) {
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
      // Arrange — agrupar por dims: cada tier tiene un unico cols x rows.
      const byTier = new Map<string, LevelFixture[]>();
      fixtures.forEach((fixture) => {
        const key = `${fixture.cols}x${fixture.rows}`;
        byTier.set(key, [...(byTier.get(key) ?? []), fixture]);
      });
      // Act + Assert
      expect(byTier.size).toBe(5);
      byTier.forEach((tier) => {
        const ordered = [...tier].sort((a, b) => a.order - b.order);
        for (let i = 1; i < ordered.length; i++) {
          expect(ordered[i].arrows.length).toBeGreaterThanOrEqual(
            ordered[i - 1].arrows.length,
          );
        }
      });
    });
  });

  describe('time limits', () => {
    it('should set timeLimitSec=120 on every tier 4 level (orders 10..12)', () => {
      // Arrange
      const tier4 = fixtures.filter((f) => f.order >= 10 && f.order <= 12);
      // Assert
      expect(tier4).toHaveLength(3);
      tier4.forEach((fixture) => expect(fixture.timeLimitSec).toBe(120));
    });

    it('should set timeLimitSec=180 on every tier 5 level (orders 13..15)', () => {
      // Arrange
      const tier5 = fixtures.filter((f) => f.order >= 13 && f.order <= 15);
      // Assert
      expect(tier5).toHaveLength(3);
      tier5.forEach((fixture) => expect(fixture.timeLimitSec).toBe(180));
    });

    it('should omit timeLimitSec on tier 1..3 levels (orders 1..9)', () => {
      // Arrange
      const early = fixtures.filter((f) => f.order <= 9);
      // Assert
      expect(early).toHaveLength(9);
      early.forEach((fixture) => expect(fixture.timeLimitSec).toBeUndefined());
    });
  });
});
