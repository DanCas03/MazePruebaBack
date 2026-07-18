import * as fs from 'fs';
import * as path from 'path';
import { LevelSolver } from './level-solver';
import { LevelBuilder, SpaceDescriptor } from '../entities/level.builder';
import { Level } from '../entities/level.entity';
import { LevelId } from '../value-objects/level-id.vo';
import { ArrowId } from '../value-objects/arrow-id.vo';
import type { ArrowPrimitives } from '../entities/arrow.factory';

// Contrato fijado por ADR 0002 (back#6, Tarea 2): LevelSolver es un servicio
// de dominio sin estado que decide si un nivel arrow-path es soluble con un
// algoritmo greedy determinista — escanea level.arrows en su orden, quita la
// primera flecha que puede salir y reinicia el escaneo tras cada remoción.
describe('LevelSolver', () => {
  let solver: LevelSolver;

  beforeEach(() => {
    solver = new LevelSolver();
  });

  // Helper: compara la Solución por valor (ids en string) en vez de por
  // identidad de instancias de ArrowId.
  const idsOf = (arrows: ArrowId[] | null): string[] | null =>
    arrows === null ? null : arrows.map((id) => id.value);

  describe('solve', () => {
    it('should return an empty array when the level has no arrows', () => {
      // Arrange
      const level = new LevelBuilder(new LevelId('l-empty'))
        .withDimensions(3, 3)
        .build();
      // Act
      const result = solver.solve(level);
      // Assert
      expect(idsOf(result)).toEqual([]);
    });

    it('should return the single arrow id when its lane to the edge is clear', () => {
      // Arrange
      const level = new LevelBuilder(new LevelId('l-clear-lane'))
        .withDimensions(3, 3)
        .addArrow({
          id: 'a',
          headDir: 'right',
          cells: [
            [1, 0],
            [1, 1],
          ],
        })
        .build();
      // Act
      const result = solver.solve(level);
      // Assert
      expect(idsOf(result)).toEqual(['a']);
    });

    it('should exit an arrow whose head is already flush against the board edge — empty lane', () => {
      // Arrange
      const level = new LevelBuilder(new LevelId('l-edge-head'))
        .withDimensions(3, 3)
        .addArrow({
          id: 'a',
          headDir: 'right',
          cells: [
            [0, 0],
            [0, 1],
            [0, 2],
          ],
        })
        .build();
      // Act
      const result = solver.solve(level);
      // Assert
      expect(idsOf(result)).toEqual(['a']);
    });

    it('should return null when two arrows form a cyclic mutual block', () => {
      // Arrange
      const level = new LevelBuilder(new LevelId('l-cyclic-block'))
        .withDimensions(4, 1)
        .addArrow({
          id: 'a',
          headDir: 'right',
          cells: [
            [0, 0],
            [0, 1],
          ],
        })
        .addArrow({
          id: 'b',
          headDir: 'left',
          cells: [
            [0, 3],
            [0, 2],
          ],
        })
        .build();
      // Act
      const result = solver.solve(level);
      // Assert
      expect(result).toBeNull();
    });

    it('should resolve an order-dependent block by exiting the unblocked arrow first and restarting the scan', () => {
      // Arrange — b es añadida primero pero está bloqueada por a; el
      // escaneo debe reiniciarse tras sacar a para poder sacar b después.
      const level = new LevelBuilder(new LevelId('l-order-dependent'))
        .withDimensions(5, 1)
        .addArrow({
          id: 'b',
          headDir: 'right',
          cells: [
            [0, 0],
            [0, 1],
          ],
        })
        .addArrow({
          id: 'a',
          headDir: 'right',
          cells: [
            [0, 2],
            [0, 3],
          ],
        })
        .build();
      // Act
      const result = solver.solve(level);
      // Assert
      expect(idsOf(result)).toEqual(['a', 'b']);
    });

    it('should solve a bent snake blocked by a straight arrow that can exit first', () => {
      // Arrange — el carril de s pasa por la celda de c; el carril de c
      // está libre, así que c debe salir antes de que s pueda salir.
      const level = new LevelBuilder(new LevelId('l-bent-snake-solvable'))
        .withDimensions(3, 3)
        .addArrow({
          id: 's',
          headDir: 'up',
          cells: [
            [2, 0],
            [1, 0],
            [1, 1],
          ],
        })
        .addArrow({
          id: 'c',
          headDir: 'left',
          cells: [
            [0, 2],
            [0, 1],
          ],
        })
        .build();
      // Act
      const result = solver.solve(level);
      // Assert
      expect(idsOf(result)).toEqual(['c', 's']);
    });

    it("should return null when a bent snake and a straight arrow block each other's lanes", () => {
      // Arrange — el carril de c pasa por la celda [1,1] de s y el carril
      // de s pasa por la celda [0,1] de c: bloqueo mutuo, ningún orden libera.
      const level = new LevelBuilder(new LevelId('l-bent-snake-unsolvable'))
        .withDimensions(3, 3)
        .addArrow({
          id: 's',
          headDir: 'up',
          cells: [
            [2, 0],
            [1, 0],
            [1, 1],
          ],
        })
        .addArrow({
          id: 'c',
          headDir: 'down',
          cells: [[0, 1]],
        })
        .build();
      // Act
      const result = solver.solve(level);
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('isSolvable', () => {
    it('should return true for an empty level, matching solve(level) !== null', () => {
      // Arrange
      const level = new LevelBuilder(new LevelId('l-empty-is-solvable'))
        .withDimensions(3, 3)
        .build();
      // Act
      const result = solver.isSolvable(level);
      // Assert
      expect(result).toBe(true);
    });

    it('should return true regardless of arrow insertion order for an order-dependent solvable level', () => {
      // Arrange — mismas flechas del caso "order-dependent" en ambos órdenes.
      const arrowB = {
        id: 'b',
        headDir: 'right',
        cells: [
          [0, 0],
          [0, 1],
        ] as [number, number][],
      };
      const arrowA = {
        id: 'a',
        headDir: 'right',
        cells: [
          [0, 2],
          [0, 3],
        ] as [number, number][],
      };
      const levelBA = new LevelBuilder(new LevelId('l-order-ba'))
        .withDimensions(5, 1)
        .addArrow(arrowB)
        .addArrow(arrowA)
        .build();
      const levelAB = new LevelBuilder(new LevelId('l-order-ab'))
        .withDimensions(5, 1)
        .addArrow(arrowA)
        .addArrow(arrowB)
        .build();
      // Act
      const resultBA = solver.isSolvable(levelBA);
      const resultAB = solver.isSolvable(levelAB);
      // Assert
      expect(resultBA).toBe(true);
      expect(resultAB).toBe(true);
    });

    it('should return false regardless of arrow insertion order for a cyclically blocked level', () => {
      // Arrange — mismas flechas del caso "cyclic-block" en ambos órdenes.
      const arrowA = {
        id: 'a',
        headDir: 'right',
        cells: [
          [0, 0],
          [0, 1],
        ] as [number, number][],
      };
      const arrowB = {
        id: 'b',
        headDir: 'left',
        cells: [
          [0, 3],
          [0, 2],
        ] as [number, number][],
      };
      const levelAB = new LevelBuilder(new LevelId('l-cyclic-ab'))
        .withDimensions(4, 1)
        .addArrow(arrowA)
        .addArrow(arrowB)
        .build();
      const levelBA = new LevelBuilder(new LevelId('l-cyclic-ba'))
        .withDimensions(4, 1)
        .addArrow(arrowB)
        .addArrow(arrowA)
        .build();
      // Act
      const resultAB = solver.isSolvable(levelAB);
      const resultBA = solver.isSolvable(levelBA);
      // Assert
      expect(resultAB).toBe(false);
      expect(resultBA).toBe(false);
    });
  });

  // Golden-master de la Solución canónica del LevelSolver (concepto de back#30):
  // fixtures y snapshot son un contrato ESTÁTICO y autocontenido junto a este
  // spec (characterization-fixtures.json + characterization-solutions.snapshot.json),
  // DELIBERADAMENTE independiente de prisma/levels/*.json (el catálogo vivo de
  // campaña) — back#39 lo desacopló para que resembrar la campaña ya NO obligue
  // a recapturar el snapshot. Estos fixtures son sintéticos (no derivan de la
  // campaña ni del replay greedy pre-back#30): el snapshot congela DE UNA VEZ la
  // Solución (orden de remoción) que el solver ACTUAL produce sobre ellos. Es
  // una guarda de regresión hacia delante — NO regenerar tras cambios al solver:
  // una divergencia DEBE romper este test. Se apoya en el determinismo del
  // solver (ADR 0002 dec. 5), que hace la Solución canónica bien definida y
  // estable. Se lee por __dirname (no cwd): los fixtures son datos del test,
  // coubicados con él.
  describe('golden-master characterization (back#30, decoupled back#39)', () => {
    interface LevelFixture {
      levelId: string;
      order: number;
      cols: number;
      rows: number;
      timeLimitSec?: number;
      // back#59: fixtures hex declaran su geometría igual que el wire real.
      space?: SpaceDescriptor;
      arrows: ArrowPrimitives[];
    }

    const fixtures = (
      JSON.parse(
        fs.readFileSync(
          path.join(__dirname, 'characterization-fixtures.json'),
          'utf8',
        ),
      ) as LevelFixture[]
    ).sort((a, b) => a.order - b.order);

    const snapshot = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, 'characterization-solutions.snapshot.json'),
        'utf8',
      ),
    ) as Record<string, string[]>;

    const buildLevel = (fixture: LevelFixture): Level => {
      const builder = new LevelBuilder(new LevelId(fixture.levelId))
        .withDimensions(fixture.cols, fixture.rows)
        .withSpace(fixture.space)
        .withTimeLimit(fixture.timeLimitSec);
      fixture.arrows.forEach((arrow) => builder.addArrow(arrow));
      return builder.build();
    };

    it('should cover every static characterization fixture in the frozen snapshot', () => {
      // Arrange + Act — lectura de fixtures y snapshot estáticos
      // Assert — cuenta exacta (bloquea pérdida silenciosa) + paridad de ids
      expect(fixtures).toHaveLength(5);
      expect(Object.keys(snapshot).sort()).toEqual(
        fixtures.map((fixture) => fixture.levelId).sort(),
      );
    });

    it.each(fixtures.map((f) => [f.levelId, f] as const))(
      'should reproduce the frozen canonical Solution for %s',
      (levelId, fixture) => {
        // Arrange
        const level = buildLevel(fixture);
        // Act
        const result = solver.solve(level);
        // Assert
        expect(idsOf(result)).toEqual(snapshot[levelId]);
      },
    );

    it('should return the exact same Solution across repeated calls on every fixture', () => {
      // Arrange
      const levels = fixtures.map(buildLevel);
      // Act
      const firstRun = levels.map((level) => idsOf(solver.solve(level)));
      const secondRun = levels.map((level) => idsOf(solver.solve(level)));
      // Assert
      expect(secondRun).toEqual(firstRun);
    });
  });

  // back#30: el residuo no pelable es diagnóstico INTERNO del solver — se
  // alcanza por acceso indexado al método privado, sin ampliar la interface
  // pública (decisión del brief: no exponer diagnósticos todavía).
  describe('blocking graph internals (back#30)', () => {
    it('should keep both mutually blocking arrows in the internal non-peelable residue', () => {
      // Arrange — mismo ciclo de 2 flechas del caso "cyclic-block".
      const level = new LevelBuilder(new LevelId('l-residue-cycle'))
        .withDimensions(4, 1)
        .addArrow({
          id: 'a',
          headDir: 'right',
          cells: [
            [0, 0],
            [0, 1],
          ],
        })
        .addArrow({
          id: 'b',
          headDir: 'left',
          cells: [
            [0, 3],
            [0, 2],
          ],
        })
        .build();
      // Act
      const { order, residue } = solver['peel'](level);
      // Assert
      expect(order).toEqual([]);
      expect(residue.map((id) => id.value).sort()).toEqual(['a', 'b']);
    });
  });

  // back#30 AC de escala: el grafo de bloqueos debe sostener la campaña
  // re-producida de ADR 0003 (50x50, ~300-400 flechas) sin degradar el seed
  // ni GET /levels/:id/solution.
  describe('scale (back#30)', () => {
    it('should solve a synthetic 50x50 level with 325 arrows in under 250 ms', () => {
      // Arrange — 13 filas x 25 flechas horizontales de 2 celdas apuntando
      // a la derecha: cada flecha está bloqueada por todas las de su
      // derecha, así que el pelado procede de derecha a izquierda por fila.
      const builder = new LevelBuilder(
        new LevelId('l-scale-50x50'),
      ).withDimensions(50, 50);
      for (let row = 0; row < 13; row++) {
        for (let col = 0; col < 50; col += 2) {
          builder.addArrow({
            id: `s-${row}-${col}`,
            headDir: 'right',
            cells: [
              [row, col],
              [row, col + 1],
            ],
          });
        }
      }
      const level = builder.build();
      // Act
      const startMs = performance.now();
      const result = solver.solve(level);
      const elapsedMs = performance.now() - startMs;
      // Assert
      expect(level.arrows.length).toBe(325);
      expect(idsOf(result)).toHaveLength(325);
      expect(elapsedMs).toBeLessThan(250);
    });
  });

  // back#59: certificación hex — el solver resuelve niveles hexagonales sin
  // ningún cambio, vía el seam BoardSpace (ADR 0005/0007).
  describe('hexagonal levels (back#59)', () => {
    it('should solve a solvable hex level', () => {
      // Arrange — R=2: a-0 sube con carril libre; a-1 sale down de inmediato.
      const level = new LevelBuilder(new LevelId('l-hex-solvable'))
        .withDimensions(0, 0)
        .withSpace({ type: 'hex', radius: 2 })
        .addArrow({
          id: 'a-0',
          headDir: 'up',
          cells: [
            [1, 2],
            [2, 2],
          ],
        })
        .addArrow({
          id: 'a-1',
          headDir: 'down',
          cells: [
            [3, 2],
            [3, 1],
          ],
        })
        .build();
      // Act
      const result = solver.solve(level);
      // Assert
      expect(result).not.toBeNull();
      expect(idsOf(result)!.sort()).toEqual(['a-0', 'a-1']);
    });

    it('should return null for a mutually blocked hex level', () => {
      // Arrange — R=2, misma columna axial: a-0 sube contra a-1 que baja.
      const level = new LevelBuilder(new LevelId('l-hex-unsolvable'))
        .withDimensions(0, 0)
        .withSpace({ type: 'hex', radius: 2 })
        .addArrow({
          id: 'a-0',
          headDir: 'up',
          cells: [
            [2, 2],
            [3, 2],
          ],
        })
        .addArrow({
          id: 'a-1',
          headDir: 'down',
          cells: [
            [1, 2],
            [0, 2],
          ],
        })
        .build();
      // Act / Assert — bloqueo mutuo: up de a-0 pisa (1,2) de a-1 y viceversa.
      expect(solver.solve(level)).toBeNull();
    });
  });

  describe('reproducibility', () => {
    it('should return identical arrays across repeated calls on the same order-dependent level', () => {
      // Arrange
      const level = new LevelBuilder(new LevelId('l-reproducible'))
        .withDimensions(5, 1)
        .addArrow({
          id: 'b',
          headDir: 'right',
          cells: [
            [0, 0],
            [0, 1],
          ],
        })
        .addArrow({
          id: 'a',
          headDir: 'right',
          cells: [
            [0, 2],
            [0, 3],
          ],
        })
        .build();
      // Act
      const firstRun = idsOf(solver.solve(level));
      const secondRun = idsOf(solver.solve(level));
      // Assert
      expect(firstRun).toEqual(['a', 'b']);
      expect(secondRun).toEqual(firstRun);
    });
  });
});
