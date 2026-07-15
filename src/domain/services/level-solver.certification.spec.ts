import { LevelSolver } from './level-solver';
import { Level } from '../entities/level.entity';
import { Arrow } from '../entities/arrow.entity';
import { LevelId } from '../value-objects/level-id.vo';
import { ArrowId } from '../value-objects/arrow-id.vo';
import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { RectSpace } from '../space/rect-space';
import { HoledRectSpace } from '../space/testing/holed-rect-space';

// Certificación OCP (ADR 0005, decisión 7): el MISMO LevelSolver — sin
// editarle una línea — resuelve niveles sobre un espacio agujereado
// construido en memoria, porque TODA la geometría vive en BoardSpace y el
// solver solo consulta level.space.exitLane(head, headDir). El agujero es
// FRONTERA: un carril que llega a él termina ahí, así que salir por el
// agujero cuenta como salida. Instancias reales, sin mocks; los Level se
// construyen DIRECTO con new Level(...) porque LevelBuilder solo fabrica
// RectSpace y aquí se certifica precisamente la geometría no rectangular.
// Notación en comentarios: (row, col).
describe('LevelSolver — certificación OCP sobre BoardSpace (ADR 0005)', () => {
  let solver: LevelSolver;

  beforeEach(() => {
    solver = new LevelSolver();
  });

  // Helper: posiciones a partir de pares (row, col), como en el contract test.
  const positionsOf = (...coords: [number, number][]): Position[] =>
    coords.map(([row, col]) => new Position(row, col));

  // Helper: compara la Solución por valor (ids planos) en vez de por
  // identidad de instancias de ArrowId.
  const idsOf = (arrows: ArrowId[] | null): string[] | null =>
    arrows === null ? null : arrows.map((id) => id.value);

  describe('el agujero convierte un ciclo insoluble en soluble', () => {
    // Flechas idénticas para ambos niveles, reconstruidas por llamada (cada
    // Level recibe instancias frescas). Orden congelado en el array: [a, b].
    // - a: camino (2,0)→(2,1), cabeza en (2,1), sale hacia RIGHT.
    // - b: celda única (2,3), sale hacia LEFT.
    const buildArrows = (): Arrow[] => [
      new Arrow(new ArrowId('a'), positionsOf([2, 0], [2, 1]), Direction.RIGHT),
      new Arrow(new ArrowId('b'), positionsOf([2, 3]), Direction.LEFT),
    ];

    it('should return null and be unsolvable when the arrows mutually block on a plain RectSpace', () => {
      // Arrange — sobre RectSpace(5x5) el carril de a hacia RIGHT es
      // [(2,2),(2,3),(2,4)] y contiene a b; el carril de b hacia LEFT es
      // [(2,2),(2,1),(2,0)] y contiene a a: ciclo de bloqueo mutuo que
      // ningún orden de remoción libera.
      const level = new Level(
        new LevelId('cert-rect-cycle'),
        new RectSpace(5, 5),
        buildArrows(),
      );
      // Act
      const solution = solver.solve(level);
      const solvable = solver.isSolvable(level);
      // Assert
      expect(solution).toBeNull();
      expect(solvable).toBe(false);
    });

    it('should peel both arrows in frozen-index order when the hole at (2,2) truncates both lanes', () => {
      // Arrange — MISMAS flechas, MISMO solver, geometría distinta: en el
      // espacio agujereado el agujero (2,2) es frontera, ambos carriles
      // terminan en él y quedan vacíos ⇒ ambas cabezas están pegadas a la
      // frontera y nadie bloquea a nadie. b está MÁS ALLÁ del agujero sobre
      // el carril rectangular de a, y aquí deja de bloquear porque el
      // agujero corta el carril. Mismo solver, misma mecánica, geometría
      // distinta — OCP demostrado.
      const level = new Level(
        new LevelId('cert-holed-cycle-broken'),
        new HoledRectSpace(5, 5, [new Position(2, 2)]),
        buildArrows(),
      );
      // Act
      const solution = solver.solve(level);
      const solvable = solver.isSolvable(level);
      // Assert — orden por índice congelado en level.arrows: [a, b].
      expect(idsOf(solution)).toEqual(['a', 'b']);
      expect(solvable).toBe(true);
    });
  });

  describe('el carril truncado sigue viendo a los bloqueadores previos al agujero', () => {
    it('should order the pre-hole blocker first and ignore the arrow beyond the hole', () => {
      // Arrange — agujero en (2,3); orden congelado [a, d, e]:
      // - a: celda (2,0), sale hacia RIGHT; su carril truncado es
      //   [(2,1),(2,2)] porque termina en el agujero.
      // - d: celda (2,2), sale hacia UP con carril [(1,2),(0,2)] libre.
      //   Está DENTRO del carril truncado de a ⇒ el bloqueador ANTERIOR al
      //   agujero sigue contando: d bloquea a a.
      // - e: celda (2,4), cabeza pegada al borde derecho (carril vacío),
      //   libre. Está MÁS ALLÁ del agujero en la fila de a ⇒ el de DESPUÉS
      //   del agujero no cuenta: e NO bloquea a a.
      // In-degrees: a=1, d=0, e=0. El heap por índice congelado pela d[1],
      // eso libera a[0] y a sale antes que e[2]: orden determinista.
      const space = new HoledRectSpace(5, 5, [new Position(2, 3)]);
      const arrows = [
        new Arrow(new ArrowId('a'), positionsOf([2, 0]), Direction.RIGHT),
        new Arrow(new ArrowId('d'), positionsOf([2, 2]), Direction.UP),
        new Arrow(new ArrowId('e'), positionsOf([2, 4]), Direction.RIGHT),
      ];
      const level = new Level(
        new LevelId('cert-holed-truncated-lane'),
        space,
        arrows,
      );
      // Act
      const solution = solver.solve(level);
      const solvable = solver.isSolvable(level);
      // Assert
      expect(idsOf(solution)).toEqual(['d', 'a', 'e']);
      expect(solvable).toBe(true);
    });
  });

  describe('vacuidad sobre espacio agujereado', () => {
    it('should return an empty array and be solvable when the holed level has no arrows', () => {
      // Arrange — soluble por vacuidad: misma semántica que en el espacio
      // rectangular (nivel sin flechas ⇒ Solución []).
      const level = new Level(
        new LevelId('cert-holed-empty'),
        new HoledRectSpace(5, 5, [new Position(2, 2)]),
        [],
      );
      // Act
      const solution = solver.solve(level);
      const solvable = solver.isSolvable(level);
      // Assert
      expect(idsOf(solution)).toEqual([]);
      expect(solvable).toBe(true);
    });
  });
});
