# back #59 — HexSpace + HexMaskedSpace + wire `space` + sección `hex` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Espacio hexagonal flat-top como nueva estrategia `BoardSpace` (con gemelo enmascarado), descriptor de geometría `space` en el wire y sección de producto `hex`, sin tocar solver/`exitLane`/`areAdjacent`/`Position`.

**Architecture:** `HexSpace extends BoardSpace` interpreta las 6 direcciones hex (único switch hex del artefacto); `HexMaskedSpace extends HexSpace` restringe por set de celdas ACTIVAS (espejo de HoledRectSpace, NO decorador — deuda ADR-0007 D5). `LevelBuilder.withSpace(descriptor)` es el único punto de instanciación desde el wire; el mapper deriva el campo `space` del DTO por `instanceof`. Spec aprobado: `docs/superpowers/specs/2026-07-18-back59-hex-space-design.md`.

**Tech Stack:** NestJS/TypeScript, Jest (AAA), Prisma (sin cambios de esquema).

## Global Constraints

- Rama: `feat/59-hex-space` (base `feat/58-direction-8-values`, PR #61). Commits por fragmento, Conventional Commits.
- Axiales sobre `Position(row,col)` SIN tocar el VO: `q = col − radius`, `r = row − radius`.
- Deltas hex (drow, dcol) SOLO dentro de `HexSpace.step`: up (−1,0), down (+1,0), upRight (−1,+1), downRight (0,+1), upLeft (0,−1), downLeft (+1,−1).
- `step` con dirección ajena (`left`/`right`) ⇒ `InvalidDirectionException` (ley del contrato #58); `default` tipado `never`.
- Wire: `space?: {type:'hex', radius}` — ausente ⇒ rect; forma inválida ⇒ `InvalidBoardSpaceException`. Con `space`, `cols`/`rows` del wire se ignoran. hex+`silhouette` ⇒ `HexMaskedSpace` (silueta = frontera jugable; asimetría consciente con rect, documentar).
- DTO: `cols`/`rows` siempre presentes (bounding box, ya derivado en `Level`); sin `space` el DTO es byte a byte el actual.
- Golden master: los 4 fixtures previos sin diff; NO regenerar snapshot de fixtures existentes.
- Tests AAA con comentarios `// Arrange / Act / Assert`; specs coubicados (`src/.../x.spec.ts`).
- Tras cada task: entrada en `AI_HISTORY.MD` (numeración desde **081**) incluida en el commit del fragmento.
- Comandos: `npx jest <ruta> --silent`; suite completa `npm test`; lint `npm run lint` (baseline: 0 errores, ~28 warnings).

---

### Task 1: `HexSpace`

**Files:**
- Create: `src/domain/space/hex-space.ts`
- Create: `src/domain/space/hex-space.spec.ts`
- Modify: `src/domain/space/board-space.contract.spec.ts:21-24` (añadir caso a `spaceCases` — ver nota, se hace en Task 2 junto al masked)

**Interfaces:**
- Consumes: `BoardSpace`, `Position`, `Direction` (8 valores de #58), `InvalidBoardSpaceException`, `InvalidDirectionException`.
- Produces: `class HexSpace extends BoardSpace { constructor(readonly radius: number) }` con `directions` (6), `contains`, `step`, `cellCount`, `allCells()` — lo consumen Tasks 2, 3, 4.

- [ ] **Step 1: Write the failing test** — `src/domain/space/hex-space.spec.ts`:

```typescript
import { HexSpace } from './hex-space';
import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { InvalidBoardSpaceException } from '../exceptions/invalid-board-space.exception';
import { InvalidDirectionException } from '../exceptions/invalid-direction.exception';

// HexSpace (ADR-0007 D1, back#59): hex flat-top de radio R sobre axiales
// q = col - R, r = row - R. Notación en comentarios: (row, col).
describe('HexSpace', () => {
  it.each([[0], [-1], [1.5], [NaN]])(
    'should throw for invalid radius %p',
    (radius) => {
      // Act / Assert
      expect(() => new HexSpace(radius as number)).toThrow(
        InvalidBoardSpaceException,
      );
    },
  );

  it('should publish exactly the six hex directions without left/right', () => {
    // Arrange
    const sut = new HexSpace(2);
    // Act / Assert
    expect(sut.directions).toEqual([
      Direction.UP,
      Direction.DOWN,
      Direction.UP_RIGHT,
      Direction.DOWN_RIGHT,
      Direction.UP_LEFT,
      Direction.DOWN_LEFT,
    ]);
  });

  it('should contain the center and the six corners of the hexagon', () => {
    // Arrange — R=2: centro (2,2); esquinas axiales (±R,0),(0,±R),(R,−R),(−R,R).
    const sut = new HexSpace(2);
    // Act / Assert
    expect(sut.contains(new Position(2, 2))).toBe(true); // q=0, r=0
    expect(sut.contains(new Position(0, 2))).toBe(true); // q=0, r=−2
    expect(sut.contains(new Position(4, 2))).toBe(true); // q=0, r=+2
    expect(sut.contains(new Position(2, 0))).toBe(true); // q=−2, r=0
    expect(sut.contains(new Position(2, 4))).toBe(true); // q=+2, r=0
    expect(sut.contains(new Position(0, 4))).toBe(true); // q=+2, r=−2
    expect(sut.contains(new Position(4, 0))).toBe(true); // q=−2, r=+2
  });

  it('should exclude the bounding-box corners cut by |q+r| > R', () => {
    // Arrange — R=2: (0,0) tiene q=−2,r=−2 (q+r=−4); (4,4) tiene q+r=+4.
    const sut = new HexSpace(2);
    // Act / Assert
    expect(sut.contains(new Position(0, 0))).toBe(false);
    expect(sut.contains(new Position(4, 4))).toBe(false);
    expect(sut.contains(new Position(0, 1))).toBe(false); // q=−1, r=−2 → q+r=−3
    expect(sut.contains(new Position(5, 2))).toBe(false); // r=+3 fuera de eje
  });

  it.each([
    [1, 7],
    [2, 19],
    [3, 37],
    [4, 61],
    [5, 91],
  ])('should count 3R²+3R+1 cells for radius %i', (radius, expected) => {
    // Act / Assert
    expect(new HexSpace(radius).cellCount).toBe(expected);
  });

  it('should step from the center to its six neighbors with hex deltas', () => {
    // Arrange — R=2, centro (2,2).
    const sut = new HexSpace(2);
    const center = new Position(2, 2);
    // Act / Assert — deltas (drow, dcol) de la convención canónica.
    expect(sut.step(center, Direction.UP)).toEqual(new Position(1, 2));
    expect(sut.step(center, Direction.DOWN)).toEqual(new Position(3, 2));
    expect(sut.step(center, Direction.UP_RIGHT)).toEqual(new Position(1, 3));
    expect(sut.step(center, Direction.DOWN_RIGHT)).toEqual(new Position(2, 3));
    expect(sut.step(center, Direction.UP_LEFT)).toEqual(new Position(2, 1));
    expect(sut.step(center, Direction.DOWN_LEFT)).toEqual(new Position(3, 1));
  });

  it('should return null when stepping across the hex frontier', () => {
    // Arrange — R=1: (0,1) es el vértice superior (q=0, r=−1).
    const sut = new HexSpace(1);
    // Act / Assert — up sale del hex; downLeft desde (0,2) va a (1,1) (dentro).
    expect(sut.step(new Position(0, 1), Direction.UP)).toBeNull();
    expect(sut.step(new Position(0, 2), Direction.UP_RIGHT)).toBeNull();
  });

  it('should throw when stepping left or right (foreign directions)', () => {
    // Arrange
    const sut = new HexSpace(2);
    const center = new Position(2, 2);
    // Act / Assert — fail-fast, nunca frontera (ley del contrato, back#58).
    expect(() => sut.step(center, Direction.LEFT)).toThrow(
      InvalidDirectionException,
    );
    expect(() => sut.step(center, Direction.RIGHT)).toThrow(
      InvalidDirectionException,
    );
  });

  it('should build the inherited exit lane along a diagonal until the frontier', () => {
    // Arrange — R=2, cabeza en el vértice izquierdo (2,0), dirección downRight
    // recorre la fila r=0 completa: (2,1), (2,2), (2,3), (2,4).
    const sut = new HexSpace(2);
    // Act
    const lane = sut.exitLane(new Position(2, 0), Direction.DOWN_RIGHT);
    // Assert — orden cercano→frontera, cabeza excluida.
    expect(lane).toEqual([
      new Position(2, 1),
      new Position(2, 2),
      new Position(2, 3),
      new Position(2, 4),
    ]);
  });

  it('should inherit adjacency from step for hex neighbors only', () => {
    // Arrange — R=2: (2,2) y (1,3) son vecinos upRight; (2,2) y (0,2) no.
    const sut = new HexSpace(2);
    // Act / Assert
    expect(sut.areAdjacent(new Position(2, 2), new Position(1, 3))).toBe(true);
    expect(sut.areAdjacent(new Position(2, 2), new Position(0, 2))).toBe(false);
  });

  it('should enumerate allCells in canonical row-major order', () => {
    // Arrange — R=1: 7 celdas del hex dentro del bounding box 3×3.
    const sut = new HexSpace(1);
    // Act
    const cells = Array.from(sut.allCells()).map((c) => [c.row, c.col]);
    // Assert — row-major, excluidos (0,0) y (2,2) por |q+r| > 1.
    expect(cells).toEqual([
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 0],
      [2, 1],
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/domain/space/hex-space.spec.ts --silent`
Expected: FAIL — `Cannot find module './hex-space'`.

- [ ] **Step 3: Write minimal implementation** — `src/domain/space/hex-space.ts`:

```typescript
import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { BoardSpace } from './board-space';
import { InvalidBoardSpaceException } from '../exceptions/invalid-board-space.exception';
import { InvalidDirectionException } from '../exceptions/invalid-direction.exception';

// Espacio hexagonal flat-top de radio R (ADR-0007 D1, back#59): segunda
// implementación de producción de BoardSpace. Coordenadas axiales proyectadas
// sobre Position(row,col) sin tocar el VO: q = col − R, r = row − R (así toda
// celda queda no-negativa). El hex publica 6 direcciones — up/down + las 4
// diagonales de back#58 — y es su único intérprete: nada fuera de step conoce
// los deltas hex.
export class HexSpace extends BoardSpace {
  private static readonly DIRECTIONS: readonly Direction[] = Object.freeze([
    Direction.UP,
    Direction.DOWN,
    Direction.UP_RIGHT,
    Direction.DOWN_RIGHT,
    Direction.UP_LEFT,
    Direction.DOWN_LEFT,
  ]);

  constructor(readonly radius: number) {
    super();
    if (!Number.isInteger(radius) || radius < 1) {
      throw new InvalidBoardSpaceException(
        `HexSpace(radius ${radius}): radius must be an integer >= 1`,
      );
    }
  }

  get directions(): readonly Direction[] {
    return HexSpace.DIRECTIONS;
  }

  // Hexágono grande |q| ≤ R ∧ |r| ≤ R ∧ |q+r| ≤ R en axiales.
  contains(pos: Position): boolean {
    const q = pos.col - this.radius;
    const r = pos.row - this.radius;
    return (
      Math.abs(q) <= this.radius &&
      Math.abs(r) <= this.radius &&
      Math.abs(q + r) <= this.radius
    );
  }

  // El único switch dirección→delta hexagonal del artefacto (espejo del de
  // RectSpace tras back#58): exhaustivo sobre los 8 valores, left/right son
  // ajenos (fail-fast, no frontera) y el default tipado never es el tripwire
  // de compilación ante un 9º valor de Direction.
  step(pos: Position, dir: Direction): Position | null {
    if (!this.contains(pos)) {
      return null;
    }
    let row = pos.row;
    let col = pos.col;
    switch (dir) {
      case Direction.UP:
        row--;
        break;
      case Direction.DOWN:
        row++;
        break;
      case Direction.UP_RIGHT:
        row--;
        col++;
        break;
      case Direction.DOWN_RIGHT:
        col++;
        break;
      case Direction.UP_LEFT:
        col--;
        break;
      case Direction.DOWN_LEFT:
        row++;
        col--;
        break;
      case Direction.LEFT:
      case Direction.RIGHT:
        throw new InvalidDirectionException(
          `Direction '${dir}' is not valid in HexSpace (allowed: up, down, upRight, downRight, upLeft, downLeft)`,
        );
      default: {
        const _exhaustive: never = dir;
        throw new InvalidDirectionException(
          `Unhandled direction '${_exhaustive as string}'`,
        );
      }
    }
    if (row < 0 || col < 0) {
      return null;
    }
    const neighbor = new Position(row, col);
    return this.contains(neighbor) ? neighbor : null;
  }

  // Derivado de allCells (no de la fórmula 3R²+3R+1) para que una subclase
  // que restrinja contains (HexMaskedSpace) herede un cellCount coherente —
  // mismo trato que RectSpace. La fórmula la pinnea el spec.
  get cellCount(): number {
    return Array.from(this.allCells()).length;
  }

  // Bounding box (2R+1)² filtrado por contains, orden canónico row-major.
  *allCells(): Iterable<Position> {
    const side = 2 * this.radius + 1;
    for (let row = 0; row < side; row++) {
      for (let col = 0; col < side; col++) {
        const cell = new Position(row, col);
        if (this.contains(cell)) {
          yield cell;
        }
      }
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/domain/space/hex-space.spec.ts --silent`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit** (con entrada 081 en `AI_HISTORY.MD`)

```bash
git add src/domain/space/hex-space.ts src/domain/space/hex-space.spec.ts AI_HISTORY.MD
git commit -m "feat(domain): add HexSpace flat-top strategy over the BoardSpace seam"
```

---

### Task 2: `HexMaskedSpace` + ambos hex en el contract-spec

**Files:**
- Create: `src/domain/space/hex-masked-space.ts`
- Create: `src/domain/space/hex-masked-space.spec.ts`
- Modify: `src/domain/space/board-space.contract.spec.ts` (imports + `spaceCases`)

**Interfaces:**
- Consumes: `HexSpace` (Task 1), `Position`, `InvalidBoardSpaceException`.
- Produces: `class HexMaskedSpace extends HexSpace { constructor(radius: number, active: readonly Position[]) }` — la consume Task 3.

- [ ] **Step 1: Write the failing test** — `src/domain/space/hex-masked-space.spec.ts`:

```typescript
import { HexMaskedSpace } from './hex-masked-space';
import { Position } from '../value-objects/position.vo';
import { Direction } from '../value-objects/direction.vo';
import { InvalidBoardSpaceException } from '../exceptions/invalid-board-space.exception';

// HexMaskedSpace (ADR-0007 D5, back#59): hex de radio R restringido a un set
// de celdas ACTIVAS — espejo deliberado de HoledRectSpace (que resta agujeros)
// pero en positivo, como fija el brief. NO decorador: la generalización es
// deuda registrada. Toda celda fuera del set es FRONTERA.
describe('HexMaskedSpace', () => {
  // SUT: R=1 con la fila central activa — (1,0), (1,1), (1,2).
  const activeRow = [
    new Position(1, 0),
    new Position(1, 1),
    new Position(1, 2),
  ];

  it('should contain only the active cells', () => {
    // Arrange
    const sut = new HexMaskedSpace(1, activeRow);
    // Act / Assert — (0,1) pertenece al hex base pero no a la máscara.
    expect(sut.contains(new Position(1, 1))).toBe(true);
    expect(sut.contains(new Position(0, 1))).toBe(false);
    expect(sut.contains(new Position(0, 0))).toBe(false); // fuera del hex base
  });

  it('should inherit a coherent cellCount and allCells from the mask', () => {
    // Arrange
    const sut = new HexMaskedSpace(1, activeRow);
    // Act
    const cells = Array.from(sut.allCells()).map((c) => [c.row, c.col]);
    // Assert
    expect(sut.cellCount).toBe(3);
    expect(cells).toEqual([
      [1, 0],
      [1, 1],
      [1, 2],
    ]);
  });

  it('should cut the exit lane at the mask frontier', () => {
    // Arrange — up desde (1,1) sale de la máscara aunque (0,1) sea hex válido.
    const sut = new HexMaskedSpace(1, activeRow);
    // Act / Assert — la celda enmascarada es frontera, no lanza.
    expect(sut.step(new Position(1, 1), Direction.UP)).toBeNull();
    expect(sut.exitLane(new Position(1, 0), Direction.DOWN_RIGHT)).toEqual([
      new Position(1, 1),
      new Position(1, 2),
    ]);
  });

  it('should throw when the active set is empty', () => {
    // Act / Assert
    expect(() => new HexMaskedSpace(1, [])).toThrow(InvalidBoardSpaceException);
  });

  it('should throw when an active cell falls outside the base hexagon', () => {
    // Arrange — (0,0) tiene q+r=−2 en R=1: fuera del hex base.
    // Act / Assert
    expect(
      () => new HexMaskedSpace(1, [new Position(1, 1), new Position(0, 0)]),
    ).toThrow(InvalidBoardSpaceException);
  });

  it('should inherit the radius invariant from HexSpace', () => {
    // Act / Assert
    expect(() => new HexMaskedSpace(0, activeRow)).toThrow(
      InvalidBoardSpaceException,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/domain/space/hex-masked-space.spec.ts --silent`
Expected: FAIL — `Cannot find module './hex-masked-space'`.

- [ ] **Step 3: Write minimal implementation** — `src/domain/space/hex-masked-space.ts`:

```typescript
import { Position } from '../value-objects/position.vo';
import { HexSpace } from './hex-space';
import { InvalidBoardSpaceException } from '../exceptions/invalid-board-space.exception';

// Gemelo enmascarado de HexSpace (ADR-0007 D5, back#59): restringe el hex a
// un set de celdas ACTIVAS (la unión de regiones de la silhouette del wire).
// Espejo deliberado del patrón HoledRectSpace — herencia, NO decorador (la
// generalización a decorador es deuda registrada en el ADR). En hex la
// silueta ES frontera jugable: asimetría consciente con rect+themed, donde la
// silueta es solo visual y el espacio sigue completo.
export class HexMaskedSpace extends HexSpace {
  private readonly active: ReadonlySet<string>;

  constructor(radius: number, active: readonly Position[]) {
    super(radius);
    if (active.length === 0) {
      throw new InvalidBoardSpaceException(
        `HexMaskedSpace(radius ${radius}): active cell set must not be empty`,
      );
    }
    for (const cell of active) {
      if (!super.contains(cell)) {
        throw new InvalidBoardSpaceException(
          `HexMaskedSpace(radius ${radius}): active cell (${cell.row}, ${cell.col}) is outside the base hexagon`,
        );
      }
    }
    this.active = new Set(active.map((cell) => `${cell.row},${cell.col}`));
  }

  // Único override (mismo trato que HoledRectSpace): la celda no activa no
  // existe — step, exitLane, areAdjacent, allCells y cellCount heredan
  // coherentes de HexSpace.
  override contains(pos: Position): boolean {
    return super.contains(pos) && this.active.has(`${pos.row},${pos.col}`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/domain/space/hex-masked-space.spec.ts --silent`
Expected: PASS (6 tests).

- [ ] **Step 5: Extender la ley del contrato** — en `src/domain/space/board-space.contract.spec.ts` añadir imports y dos casos a `spaceCases`:

```typescript
import { HexSpace } from './hex-space';
import { HexMaskedSpace } from './hex-masked-space';
```

```typescript
const spaceCases: Array<[string, () => BoardSpace]> = [
  ['RectSpace', () => new RectSpace(4, 3)],
  ['HoledRectSpace', () => new HoledRectSpace(4, 3, [new Position(1, 2)])],
  ['HexSpace', () => new HexSpace(2)],
  [
    'HexMaskedSpace',
    () =>
      new HexMaskedSpace(2, [
        new Position(2, 1),
        new Position(2, 2),
        new Position(2, 3),
        new Position(1, 2),
        new Position(3, 2),
      ]),
  ],
];
```

Nota: el test `should not exceed the bounding box on either axis` usa (3,0)/(0,4) literales del rect 4×3 — verificar que también caen fuera de los hex R=2: (3,0) → q=−2, r=+1, q+r=−1 ✓ **está dentro del hex**. El test debe generalizarse: sustituir sus asserts por coordenadas derivadas del propio espacio:

```typescript
  it('should not contain any cell beyond the bounding box of its own cells', () => {
    // Arrange — bounding box real derivado de allCells (vale en toda geometría).
    const cells = Array.from(sut.allCells());
    const maxRow = Math.max(...cells.map((c) => c.row));
    const maxCol = Math.max(...cells.map((c) => c.col));
    // Act / Assert — una fila/columna más allá del máximo nunca pertenece.
    expect(sut.contains(new Position(maxRow + 1, 0))).toBe(false);
    expect(sut.contains(new Position(0, maxCol + 1))).toBe(false);
  });
```

Cuidado: `(maxRow+1, 0)` y `(0, maxCol+1)` deben quedar fuera en los 4 espacios — en HexSpace R=2, (5,0) tiene r=+3 ✓ fuera y (0,5) q=+3 ✓ fuera; en el masked, fuera del set ✓; en rect 4×3, (3,0)/(0,4) ✓ fuera. También revisar `should return null when stepping from a position outside the space...`: usa (5,5), fuera de los 4 espacios ✓ (en hex R=2: r=+3).

- [ ] **Step 6: Run contract suite to verify it passes**

Run: `npx jest src/domain/space/board-space.contract.spec.ts --silent`
Expected: PASS — cada ley corre contra los 4 espacios (incluida la ley fail-fast: en hex las direcciones ajenas son left/right).

- [ ] **Step 7: Commit** (con entrada 082 en `AI_HISTORY.MD`)

```bash
git add src/domain/space/hex-masked-space.ts src/domain/space/hex-masked-space.spec.ts src/domain/space/board-space.contract.spec.ts AI_HISTORY.MD
git commit -m "feat(domain): add HexMaskedSpace twin and run the space contract laws on hex"
```

---

### Task 3: sección `hex` + `LevelBuilder.withSpace`

**Files:**
- Modify: `src/domain/entities/level.entity.ts:8` (tipo `LevelSection`)
- Modify: `src/domain/entities/level.builder.ts`
- Test: `src/domain/entities/level.builder.spec.ts` (extender)

**Interfaces:**
- Consumes: `HexSpace`, `HexMaskedSpace` (Tasks 1-2), `RectSpace`, `LevelSilhouette`.
- Produces: `export interface SpaceDescriptor { type: 'hex'; radius: number }` y `withSpace(space?: SpaceDescriptor): this` en `LevelBuilder`; `LevelSection = 'campaign' | 'themed' | 'hex'` — los consumen Tasks 4-6.

- [ ] **Step 1: Write the failing tests** — añadir a `src/domain/entities/level.builder.spec.ts` (respetando helpers existentes del spec; las flechas de los casos hex usan direcciones hex válidas):

```typescript
  // back#59: descriptor de espacio del wire — el builder es el único punto
  // que traduce {type:'hex', radius} a espacios concretos.
  describe('withSpace (back#59)', () => {
    it('should build a rectangular level when the descriptor is absent', () => {
      // Arrange / Act
      const level = new LevelBuilder(new LevelId('l-rect'))
        .withDimensions(3, 2)
        .addArrow({ id: 'a-0', headDir: 'right', cells: [[0, 0], [0, 1]] })
        .build();
      // Assert — bounding box del rect intacto.
      expect(level.cols).toBe(3);
      expect(level.rows).toBe(2);
      expect(level.space).toBeInstanceOf(RectSpace);
    });

    it('should build a HexSpace level ignoring wire cols/rows', () => {
      // Arrange / Act — cols/rows del wire contradicen al hex a propósito.
      const level = new LevelBuilder(new LevelId('l-hex'))
        .withDimensions(99, 99)
        .withSpace({ type: 'hex', radius: 2 })
        .addArrow({ id: 'a-0', headDir: 'up', cells: [[2, 2], [3, 2]] })
        .build();
      // Assert — bounding box derivado del espacio: (2R+1)².
      expect(level.space).toBeInstanceOf(HexSpace);
      expect(level.cols).toBe(5);
      expect(level.rows).toBe(5);
    });

    it('should build a HexMaskedSpace when the descriptor comes with a silhouette', () => {
      // Arrange — activas = unión de las regiones de la silueta (R=1, fila
      // central). La flecha vive dentro de la máscara.
      const silhouette = {
        stem: [[1, 0], [1, 1]] as [number, number][],
        tip: [[1, 2]] as [number, number][],
      };
      // Act
      const level = new LevelBuilder(new LevelId('l-hex-masked'))
        .withDimensions(0, 0)
        .withSpace({ type: 'hex', radius: 1 })
        .withSilhouette(silhouette)
        .addArrow({ id: 'a-0', headDir: 'downRight', cells: [[1, 1], [1, 0]] })
        .build();
      // Assert — la celda hex fuera de la máscara no pertenece al espacio.
      expect(level.space).toBeInstanceOf(HexMaskedSpace);
      expect(level.space.contains(new Position(0, 1))).toBe(false);
      expect(level.space.cellCount).toBe(3);
    });

    it('should reject an arrow whose headDir is foreign to the hex space', () => {
      // Arrange / Act / Assert — invariante de Level (back#58): right ∉ hex.
      expect(() =>
        new LevelBuilder(new LevelId('l-hex-bad-dir'))
          .withDimensions(0, 0)
          .withSpace({ type: 'hex', radius: 2 })
          .addArrow({ id: 'a-0', headDir: 'right', cells: [[2, 2], [2, 1]] })
          .build(),
      ).toThrow(InvalidLevelException);
    });

    it.each([
      [{ type: 'octo', radius: 2 }],
      [{ type: 'hex', radius: 0 }],
      [{ type: 'hex', radius: 1.5 }],
    ])('should throw for invalid space descriptor %o', (descriptor) => {
      // Act / Assert — fail-fast en construcción, no datos corruptos servidos.
      expect(() =>
        new LevelBuilder(new LevelId('l-bad-space'))
          .withDimensions(3, 3)
          .withSpace(descriptor as SpaceDescriptor)
          .addArrow({ id: 'a-0', headDir: 'up', cells: [[2, 2], [3, 2]] })
          .build(),
      ).toThrow(InvalidBoardSpaceException);
    });

    it('should accept hex as a first-class section', () => {
      // Arrange / Act
      const level = new LevelBuilder(new LevelId('l-hex-section'))
        .withDimensions(3, 3)
        .withSection('hex')
        .addArrow({ id: 'a-0', headDir: 'up', cells: [[1, 1], [2, 1]] })
        .build();
      // Assert
      expect(level.section).toBe('hex');
    });
  });
```

Imports nuevos necesarios en el spec: `RectSpace`, `HexSpace`, `HexMaskedSpace`, `Position`, `SpaceDescriptor`, `InvalidBoardSpaceException`, `InvalidLevelException` (los que falten según cabecera actual del archivo).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/domain/entities/level.builder.spec.ts --silent`
Expected: FAIL — `withSpace` no existe / `SpaceDescriptor` no exportado.

- [ ] **Step 3: Implement** — en `src/domain/entities/level.entity.ts` línea 8:

```typescript
// Sección del catálogo (ADR 0004; 'hex' desde ADR-0007/back#59 — taxonomía de
// producto ORTOGONAL a la geometría: un nivel themed puede declarar space hex).
export type LevelSection = 'campaign' | 'themed' | 'hex';
```

En `src/domain/entities/level.builder.ts` — imports (`BoardSpace`, `HexSpace`, `HexMaskedSpace`, `Position`), campo, y métodos:

```typescript
// Descriptor de geometría del wire (ADR-0007 D4, back#59): forma cruda del
// campo opcional `space` del JSON de nivel. Solo 'hex' existe; ausente ⇒ rect.
export interface SpaceDescriptor {
  type: 'hex';
  radius: number;
}
```

```typescript
  private space?: SpaceDescriptor;

  // ADR-0007 (back#59): geometría explícita del wire. Ausente ⇒ rect desde
  // cols/rows (retrocompatibilidad total). Presente ⇒ cols/rows del wire se
  // IGNORAN (el bounding box lo deriva Level del espacio).
  withSpace(space?: SpaceDescriptor): this {
    this.space = space;
    return this;
  }
```

`withSection` pasa a:

```typescript
  // ADR 0004 (back#31) + ADR-0007 (back#59): solo 'themed' y 'hex' literales
  // cambian de sección; cualquier otro valor (o ausencia) es campaña.
  withSection(section?: string): this {
    this.section =
      section === 'themed' || section === 'hex' ? section : 'campaign';
    return this;
  }
```

Y `build()` delega en un privado `buildSpace()`:

```typescript
  build(): Level {
    const timeLimitSec =
      this.timeLimitSec ?? Math.max(30, this.arrows.length * 6);
    return new Level(
      this.id,
      this.buildSpace(),
      this.arrows,
      timeLimitSec,
      this.section,
      this.paint,
      this.silhouette,
    );
  }

  // Único punto (junto al propio wire) que instancia espacios concretos
  // (ADR 0005/0007). hex + silhouette ⇒ máscara con activas = unión de las
  // regiones (en hex la silueta ES frontera jugable — asimetría consciente
  // con rect+themed, donde la silueta es solo visual; ver CONTEXT.md).
  private buildSpace(): BoardSpace {
    if (this.space === undefined) {
      return new RectSpace(this.cols as number, this.rows as number);
    }
    if (this.space.type !== 'hex') {
      throw new InvalidBoardSpaceException(
        `Unknown space type '${String(this.space.type)}' (allowed: hex)`,
      );
    }
    if (this.silhouette !== undefined) {
      const active = Object.values(this.silhouette).flatMap((cells) =>
        cells.map(([row, col]) => new Position(row, col)),
      );
      return new HexMaskedSpace(this.space.radius, active);
    }
    return new HexSpace(this.space.radius);
  }
```

(`InvalidBoardSpaceException` importada de `../exceptions/invalid-board-space.exception`; la validación de radius vive en `HexSpace`, el builder no la duplica.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/domain/entities/level.builder.spec.ts src/domain/entities/level.entity.spec.ts --silent`
Expected: PASS (incluye la suite previa del builder intacta).

- [ ] **Step 5: Commit** (con entrada 083 en `AI_HISTORY.MD`)

```bash
git add src/domain/entities/level.entity.ts src/domain/entities/level.builder.ts src/domain/entities/level.builder.spec.ts AI_HISTORY.MD
git commit -m "feat(domain): wire the space descriptor and the hex section through LevelBuilder"
```

---

### Task 4: repositorio Prisma + mapper/DTO `space`

**Files:**
- Modify: `src/infrastructure/database/prisma-level.repository.ts` (interface `LevelDataPrimitives` + `toDomain`)
- Modify: `src/adapters/mappers/level.mapper.ts` (DTO + `toDto`)
- Test: `src/infrastructure/database/prisma-level.repository.spec.ts`, `src/adapters/mappers/level.mapper.spec.ts` (extender)

**Interfaces:**
- Consumes: `SpaceDescriptor`, `withSpace` (Task 3), `HexSpace` (Task 1).
- Produces: `LevelResponseDto.space?: { type: 'hex'; radius: number }` — contrato wire para front #125.

- [ ] **Step 1: Write the failing tests** — en `src/adapters/mappers/level.mapper.spec.ts`:

```typescript
  // back#59: descriptor de geometría en el DTO — presente solo en niveles hex.
  describe('space descriptor (back#59)', () => {
    it('should expose the hex space descriptor with bounding-box cols/rows', () => {
      // Arrange
      const level = new LevelBuilder(new LevelId('l-hex-dto'))
        .withDimensions(0, 0)
        .withSpace({ type: 'hex', radius: 2 })
        .addArrow({ id: 'a-0', headDir: 'up', cells: [[2, 2], [3, 2]] })
        .build();
      // Act
      const dto = LevelMapper.toDto(level);
      // Assert
      expect(dto.space).toEqual({ type: 'hex', radius: 2 });
      expect(dto.cols).toBe(5);
      expect(dto.rows).toBe(5);
    });

    it('should omit the space field entirely for rectangular levels', () => {
      // Arrange
      const level = new LevelBuilder(new LevelId('l-rect-dto'))
        .withDimensions(3, 2)
        .addArrow({ id: 'a-0', headDir: 'right', cells: [[0, 0], [0, 1]] })
        .build();
      // Act
      const dto = LevelMapper.toDto(level);
      // Assert — retrocompat byte a byte: la clave ni siquiera existe.
      expect('space' in dto).toBe(false);
    });
  });
```

Y en `src/infrastructure/database/prisma-level.repository.spec.ts` (siguiendo el patrón de mocks existente del spec para `prisma.level.findUnique`):

```typescript
    it('should rebuild a hex level from a record carrying the space descriptor (back#59)', async () => {
      // Arrange
      findUnique.mockResolvedValue({
        id: 'hex-01',
        order: null,
        section: 'hex',
        data: {
          cols: 0,
          rows: 0,
          space: { type: 'hex', radius: 2 },
          arrows: [{ id: 'a-0', headDir: 'up', cells: [[2, 2], [3, 2]] }],
        },
      });
      // Act
      const level = await repository.findById(new LevelId('hex-01'));
      // Assert
      expect(level?.space).toBeInstanceOf(HexSpace);
      expect(level?.section).toBe('hex');
    });
```

(Ajustar nombres de mock/fixture al estilo real del spec existente; si el spec usa un helper de records, extenderlo con `space?`.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/adapters/mappers/level.mapper.spec.ts src/infrastructure/database/prisma-level.repository.spec.ts --silent`
Expected: FAIL — `dto.space` undefined con hex / `HexSpace` no reconstruido.

- [ ] **Step 3: Implement** — `prisma-level.repository.ts`: importar `type { SpaceDescriptor }` desde el builder, ampliar la interface y encadenar:

```typescript
interface LevelDataPrimitives {
  cols: number;
  rows: number;
  timeLimitSec?: number;
  palette?: Record<string, string>;
  silhouette?: LevelSilhouette;
  // Descriptor de geometría (ADR-0007, back#59): ausente ⇒ rect cols×rows.
  space?: SpaceDescriptor;
  arrows: StoredArrowPrimitives[];
}
```

En `toDomain`, tras `.withDimensions(data.cols, data.rows)`:

```typescript
      // Geometría explícita (back#59): con `space` presente, cols/rows del
      // wire se ignoran — el builder construye el espacio del descriptor.
      .withSpace(data.space)
```

`level.mapper.ts`: importar `HexSpace`; en `LevelResponseDto`:

```typescript
  // Descriptor de geometría (ADR-0007, back#59): presente solo en niveles
  // hexagonales; ausente ⇒ rectángulo cols×rows (retrocompatibilidad total).
  // cols/rows siguen siendo el bounding box en ambas geometrías.
  space?: { type: 'hex'; radius: number };
```

En `toDto`, junto a los spreads condicionales existentes:

```typescript
      ...(level.space instanceof HexSpace
        ? { space: { type: 'hex' as const, radius: level.space.radius } }
        : {}),
```

Actualizar también el comentario de `LevelSummaryDto.section` a `'campaign' | 'themed' | 'hex'`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/adapters/mappers/level.mapper.spec.ts src/infrastructure/database/prisma-level.repository.spec.ts --silent`
Expected: PASS (suites previas intactas = retrocompat).

- [ ] **Step 5: Commit** (con entrada 084 en `AI_HISTORY.MD`)

```bash
git add src/infrastructure/database/prisma-level.repository.ts src/adapters/mappers/level.mapper.ts src/adapters/mappers/level.mapper.spec.ts src/infrastructure/database/prisma-level.repository.spec.ts AI_HISTORY.MD
git commit -m "feat(back): serve the hex space descriptor through repository and level DTO"
```

---

### Task 5: solver sobre niveles hex (sin tocar el solver)

**Files:**
- Test: `src/domain/services/level-solver.spec.ts` (extender — SOLO tests, cero cambios en `level-solver.ts`)

**Interfaces:**
- Consumes: `LevelBuilder.withSpace` (Task 3), `LevelSolver.solve` existente.
- Produces: certificación de que el solver es geometry-agnostic también en hex.

- [ ] **Step 1: Write the tests** (deben pasar YA si el solver es agnóstico — si fallan, es un bug de las tasks previas, no del solver):

```typescript
  // back#59: certificación hex — el solver resuelve niveles hexagonales sin
  // ningún cambio, vía el seam BoardSpace (ADR 0005/0007).
  describe('hexagonal levels (back#59)', () => {
    it('should solve a solvable hex level', () => {
      // Arrange — R=2: a-0 sube con carril libre; a-1 sale down de inmediato.
      const level = new LevelBuilder(new LevelId('l-hex-solvable'))
        .withDimensions(0, 0)
        .withSpace({ type: 'hex', radius: 2 })
        .addArrow({ id: 'a-0', headDir: 'up', cells: [[1, 2], [2, 2]] })
        .addArrow({ id: 'a-1', headDir: 'down', cells: [[3, 2], [3, 1]] })
        .build();
      // Act
      const result = solver.solve(level);
      // Assert
      expect(result).not.toBeNull();
      expect(idsOf(result).sort()).toEqual(['a-0', 'a-1']);
    });

    it('should return null for a mutually blocked hex level', () => {
      // Arrange — R=2, misma columna axial: a-0 sube contra a-1 que baja.
      const level = new LevelBuilder(new LevelId('l-hex-unsolvable'))
        .withDimensions(0, 0)
        .withSpace({ type: 'hex', radius: 2 })
        .addArrow({ id: 'a-0', headDir: 'up', cells: [[2, 2], [3, 2]] })
        .addArrow({ id: 'a-1', headDir: 'down', cells: [[1, 2], [0, 2]] })
        .build();
      // Act / Assert — bloqueo mutuo: up de a-0 pisa (1,2) de a-1 y viceversa.
      expect(solver.solve(level)).toBeNull();
    });
  });
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx jest src/domain/services/level-solver.spec.ts --silent`
Expected: PASS. Verificar con `git status` que `level-solver.ts` NO está modificado.

- [ ] **Step 3: Commit** (con entrada 085 en `AI_HISTORY.MD`)

```bash
git add src/domain/services/level-solver.spec.ts AI_HISTORY.MD
git commit -m "test(domain): certify LevelSolver over hexagonal levels without solver changes"
```

---

### Task 6: fixture hex en el golden master

**Files:**
- Modify: `src/domain/services/characterization-fixtures.json` (5º fixture)
- Modify: `src/domain/services/characterization-solutions.snapshot.json` (entrada nueva)
- Modify: `src/domain/services/level-solver.spec.ts` (interface `LevelFixture` + `buildLevel` + `toHaveLength(5)`)

**Interfaces:**
- Consumes: `SpaceDescriptor` (Task 3).
- Produces: guard de regresión hacia adelante para geometría hex.

- [ ] **Step 1: Extender el harness del golden master** en `level-solver.spec.ts`:

```typescript
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
```

En `buildLevel`, tras `.withDimensions(...)`: añadir `.withSpace(fixture.space)`. Cambiar `expect(fixtures).toHaveLength(4)` a `toHaveLength(5)`.

- [ ] **Step 2: Añadir el fixture hex** al final del array en `characterization-fixtures.json` (los 4 previos NO se tocan):

```json
  {
    "levelId": "char-05-hex-lanes",
    "order": 5,
    "cols": 0,
    "rows": 0,
    "space": { "type": "hex", "radius": 2 },
    "arrows": [
      {
        "id": "arrow-0",
        "headDir": "up",
        "cells": [[1, 2], [2, 2]]
      },
      {
        "id": "arrow-1",
        "headDir": "downRight",
        "cells": [[3, 3], [3, 2]]
      },
      {
        "id": "arrow-2",
        "headDir": "downLeft",
        "cells": [[2, 1], [1, 1]]
      }
    ]
  }
```

- [ ] **Step 3: Run to capture the canonical Solution**

Run: `npx jest src/domain/services/level-solver.spec.ts -t "char-05-hex-lanes" 2>&1 | head -40`
Expected: FAIL — el diff del assert muestra la Solución canónica actual (`Received`), p.ej. `["arrow-0", "arrow-1", "arrow-2"]` en algún orden determinista.

- [ ] **Step 4: Freeze the snapshot** — añadir a `characterization-solutions.snapshot.json` la clave `"char-05-hex-lanes"` con EXACTAMENTE el array `Received` del paso anterior (congela lo que el solver ACTUAL produce; nunca inventar el orden a mano).

- [ ] **Step 5: Run full golden master to verify it passes**

Run: `npx jest src/domain/services/level-solver.spec.ts --silent`
Expected: PASS — 5 fixtures, los 4 previos con snapshot idéntico (verificar con `git diff characterization-solutions.snapshot.json` que solo se AÑADIÓ una clave).

- [ ] **Step 6: Commit** (con entrada 086 en `AI_HISTORY.MD`)

```bash
git add src/domain/services/characterization-fixtures.json src/domain/services/characterization-solutions.snapshot.json src/domain/services/level-solver.spec.ts AI_HISTORY.MD
git commit -m "test(domain): add hex characterization fixture to the solver golden master"
```

---

### Task 7: documentación — CONTEXT.md + README

**Files:**
- Modify: `CONTEXT.md` (glosario del back)
- Modify: `README.md` (contrato wire de niveles)

**Interfaces:**
- Consumes: decisiones del spec (semántica masked, descriptor wire).
- Produces: glosario «Espacio hexagonal (HexSpace)» + sección `hex` documentados (requisito del issue).

- [ ] **Step 1: CONTEXT.md** — añadir al glosario (siguiendo el formato de las entradas existentes):
  - **Espacio hexagonal (HexSpace)**: hex flat-top de radio R sobre el seam `BoardSpace` (ADR-0007); axiales q=col−R, r=row−R; 6 direcciones (up/down + 4 diagonales); `HexMaskedSpace` = gemelo restringido a celdas activas de la silueta. **En hex la silueta es frontera jugable** (asimetría consciente con rect+themed, donde es solo visual).
  - **Sección `hex`**: tercer valor de `LevelSection`, taxonomía de producto ortogonal a la geometría.
  - **Descriptor `space`**: campo wire opcional `{type:'hex', radius}`; ausente ⇒ rect `cols×rows`.

- [ ] **Step 2: README.md** — en la sección del contrato de niveles/endpoints, documentar el campo opcional `space` del `LevelResponseDto` (con ejemplo JSON hex), que `cols`/`rows` son siempre el bounding box, y la sección `hex`.

- [ ] **Step 3: Commit** (con entrada 087 en `AI_HISTORY.MD`)

```bash
git add CONTEXT.md README.md AI_HISTORY.MD
git commit -m "docs(back): document hex space, wire descriptor and hex section"
```

---

### Task 8: verificación final

- [ ] **Step 1:** `npm test` — Expected: suite completa verde (≥454 previos + nuevos).
- [ ] **Step 2:** `npm run test:e2e` — Expected: 23/23 verde (seed rect intacto = retrocompat e2e).
- [ ] **Step 3:** `npm run lint` — Expected: 0 errores (warnings ≤ baseline ~28).
- [ ] **Step 4:** `npx jest src/domain/services/level-solver.spec.ts --silent && git diff --stat feat/58-direction-8-values -- src/domain/services/level-solver.ts` — Expected: golden master verde y **cero diff** en `level-solver.ts`.
- [ ] **Step 5:** Push + PR a `main` con `Closes #59` (nota en la descripción: apilado sobre PR #61; mergear después). El usuario decide el merge.
