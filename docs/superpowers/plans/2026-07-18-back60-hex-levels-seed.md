# back#60 — Hex Levels + Seed Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed 4 hexagonal levels (`hex-01/02/03` free R=3/4/5 + `t-snowflake` themed R=5) and wire hex support into the seed pipeline, which #59 left absent.

**Architecture:** Extract the fixture→`Level` build, `Level.data` serialization, and section resolution out of `prisma/seed.ts` into a testable `src/infrastructure/database/level-fixture.ts` module (DRY: shared by the seed and a new standalone authoring/verification script). A jest "catalog" spec re-validates every level file (solvable + silhouette/paint shape) without a DB, so authored levels are guarded in CI. Level content is authored by hand against the hex geometry and certified with the verify script + catalog spec.

**Tech Stack:** NestJS/TypeScript, Prisma 6, Jest (ts-jest), ts-node. Domain hex support (`HexSpace`, `HexMaskedSpace`, wire `space`, `LevelSolver`) already shipped in #59.

## Global Constraints

- **Branch:** `feat/60-hex-levels` (already created, stacked on `feat/59-hex-space`). Do NOT touch the two uncommitted #59 test files (`src/domain/entities/level.builder.spec.ts`, `src/domain/space/hex-space.spec.ts`) — they belong to #59's final review.
- **Coordinate order is `[row, col]` everywhere.** Silhouette/arrow cells are `[row, col]` integer pairs.
- **No-regression invariant:** for rect fixtures (no `space`), `Level.data` serialization must be **byte-identical** to pre-#60 — the 18 existing levels re-seed with no diff.
- **Calibration (D6):** `timeLimitSec = max(30, round(solutionLength × 4.5 / 5) × 5)`. Because every arrow must exit to clear the board, `solver.solve(level).length === arrows.length`.
- **Tests:** AAA pattern. `npm test` (unit, jest rootDir=`src`, `*.spec.ts`), `npm run test:e2e` (e2e), `npm run lint:check`. Specs must live under `src/` to be discovered.
- **Section value literals:** only `'themed'` and `'hex'` change section; anything else ⇒ `'campaign'`.
- **Docs:** register each fragment in `AI_HISTORY.MD` (continue the contiguous numbering — #59 ended at 087; verify with `grep -oE 'Entrada [0-9]+' AI_HISTORY.MD | tail` and use 088+). Update `README.md` when public behavior changes. Conventional Commits, one commit per task.

### Hex geometry primer (reference for every level-authoring task)

- `Position` is `[row, col]`. For radius `R`, **center = `[R, R]`**, bounding box `(2R+1)×(2R+1)`, so set `cols = rows = 2R+1`.
- Axial coords: `q = col - R`, `r = row - R`. A cell is **inside** the hexagon iff `|q| ≤ R && |r| ≤ R && |q+r| ≤ R`.
- Cell counts: R=3 → 37, R=4 → 61, R=5 → 91.
- The **6 hex directions** (wire camelCase) and their `[Δrow, Δcol]`:

  | dir | Δrow, Δcol | | dir | Δrow, Δcol |
  |---|---|---|---|---|
  | `up` | `[-1, 0]` | | `down` | `[+1, 0]` |
  | `upRight` | `[-1, +1]` | | `downRight` | `[0, +1]` |
  | `upLeft` | `[0, -1]` | | `downLeft` | `[+1, -1]` |

- An arrow's **head is `cells[0]`**, pointing toward `headDir`. Consecutive cells must be hex-adjacent (each hop = one of the 6 deltas). `LEFT`/`RIGHT` are rejected on hex. `headDir` must be one of the 6 (invariant: `headDir ∈ space.directions`).
- An arrow exits when the lane from its head along `headDir` to the frontier is clear of other arrows. In a masked space, inactive cells act as frontier (lanes stop at them).

---

## Task 1: Fixture module (shared build / serialize / section / calibration)

**Files:**
- Create: `src/infrastructure/database/level-fixture.ts`
- Test: `src/infrastructure/database/level-fixture.spec.ts`

**Interfaces:**
- Consumes: `LevelBuilder`, `SpaceDescriptor` (`src/domain/entities/level.builder.ts`); `Level`, `LevelSection`, `LevelSilhouette` (`src/domain/entities/level.entity.ts`); `LevelId`; `ArrowPrimitives` (`src/domain/entities/arrow.factory.ts`); `Prisma` (`@prisma/client`).
- Produces:
  - `interface LevelFixture` (adds `space?: SpaceDescriptor` over the old seed interface)
  - `buildLevelFromFixture(fixture: LevelFixture): Level`
  - `fixtureToData(fixture: LevelFixture): Prisma.InputJsonValue`
  - `resolveSection(fixture: LevelFixture): LevelSection`
  - `suggestTimeLimitSec(solutionLength: number): number`

- [ ] **Step 1: Write the failing test**

```typescript
// src/infrastructure/database/level-fixture.spec.ts
import {
  LevelFixture,
  buildLevelFromFixture,
  fixtureToData,
  resolveSection,
  suggestTimeLimitSec,
} from './level-fixture';
import { HexSpace } from '../../domain/space/hex-space';
import { HexMaskedSpace } from '../../domain/space/hex-masked-space';
import { RectSpace } from '../../domain/space/rect-space';

describe('level-fixture (back#60)', () => {
  describe('buildLevelFromFixture', () => {
    it('builds a full HexSpace when space is hex and no silhouette', () => {
      // Arrange
      const fixture: LevelFixture = {
        levelId: 'hex-x', section: 'hex', cols: 7, rows: 7,
        space: { type: 'hex', radius: 3 }, timeLimitSec: 45,
        arrows: [{ id: 'a', headDir: 'up', cells: [[3, 3], [4, 3]] }],
      };
      // Act
      const level = buildLevelFromFixture(fixture);
      // Assert
      expect(level.space).toBeInstanceOf(HexSpace);
      expect(level.space).not.toBeInstanceOf(HexMaskedSpace);
    });

    it('builds a HexMaskedSpace when space is hex and a silhouette is present', () => {
      // Arrange
      const fixture: LevelFixture = {
        levelId: 't-x', section: 'themed', cols: 11, rows: 11,
        space: { type: 'hex', radius: 5 },
        palette: { snow: '#E8F4FF' },
        silhouette: { snow: [[5, 5], [4, 5]] },
        arrows: [{ id: 'a', headDir: 'up', cells: [[4, 5], [5, 5]], paintRole: 'snow' }],
      };
      // Act
      const level = buildLevelFromFixture(fixture);
      // Assert
      expect(level.space).toBeInstanceOf(HexMaskedSpace);
    });

    it('builds a RectSpace when space is absent (backward compat)', () => {
      // Arrange
      const fixture: LevelFixture = {
        levelId: 'level-x', order: 1, cols: 3, rows: 3, timeLimitSec: 30,
        arrows: [{ id: 'a', headDir: 'right', cells: [[1, 0], [1, 1]] }],
      };
      // Act
      const level = buildLevelFromFixture(fixture);
      // Assert
      expect(level.space).toBeInstanceOf(RectSpace);
    });

    it('accepts diagonal hex headDir (proves withSpace is applied, not RectSpace)', () => {
      // Arrange — 'upRight' would throw InvalidLevelException on a RectSpace.
      const fixture: LevelFixture = {
        levelId: 'hex-diag', section: 'hex', cols: 5, rows: 5,
        space: { type: 'hex', radius: 2 }, timeLimitSec: 30,
        arrows: [{ id: 'a', headDir: 'upRight', cells: [[2, 2], [3, 1]] }],
      };
      // Act + Assert
      expect(() => buildLevelFromFixture(fixture)).not.toThrow();
    });
  });

  describe('fixtureToData', () => {
    it('includes space when present', () => {
      // Arrange
      const fixture: LevelFixture = {
        levelId: 'hex-x', section: 'hex', cols: 7, rows: 7,
        space: { type: 'hex', radius: 3 }, timeLimitSec: 45,
        arrows: [{ id: 'a', headDir: 'up', cells: [[3, 3], [4, 3]] }],
      };
      // Act
      const data = fixtureToData(fixture) as Record<string, unknown>;
      // Assert
      expect(data.space).toEqual({ type: 'hex', radius: 3 });
    });

    it('is byte-identical for rect fixtures (no space key)', () => {
      // Arrange
      const fixture: LevelFixture = {
        levelId: 'level-x', order: 1, cols: 3, rows: 3, timeLimitSec: 30,
        arrows: [{ id: 'a', headDir: 'right', cells: [[1, 0], [1, 1]] }],
      };
      // Act
      const data = fixtureToData(fixture);
      // Assert
      expect(data).toEqual({
        cols: 3, rows: 3, timeLimitSec: 30,
        arrows: [{ id: 'a', headDir: 'right', cells: [[1, 0], [1, 1]] }],
      });
      expect(data).not.toHaveProperty('space');
    });
  });

  describe('resolveSection', () => {
    it.each([
      ['hex', 'hex'],
      ['themed', 'themed'],
      [undefined, 'campaign'],
      ['garbage', 'campaign'],
    ])('maps section %s -> %s', (input, expected) => {
      expect(resolveSection({ levelId: 'x', cols: 1, rows: 1, section: input as string | undefined, arrows: [] })).toBe(expected);
    });
  });

  describe('suggestTimeLimitSec', () => {
    it.each([
      [10, 45], [17, 75], [27, 120], [7, 30], [0, 30],
    ])('len %i -> %i s', (len, expected) => {
      expect(suggestTimeLimitSec(len)).toBe(expected);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- level-fixture.spec`
Expected: FAIL — `Cannot find module './level-fixture'`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/infrastructure/database/level-fixture.ts
import { Prisma } from '@prisma/client';
import {
  Level,
  LevelSection,
  LevelSilhouette,
} from '../../domain/entities/level.entity';
import {
  LevelBuilder,
  SpaceDescriptor,
} from '../../domain/entities/level.builder';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import type { ArrowPrimitives } from '../../domain/entities/arrow.factory';

// Superset declarativo de un fixture de nivel (prisma/levels/*.json): las
// columnas de tabla (levelId, order, section) izadas junto a Level.data.
// back#60 (ADR-0007): `space` opcional describe la geometría hex; ausente ⇒ rect.
export interface LevelFixture {
  levelId: string;
  order?: number;
  section?: string;
  cols: number;
  rows: number;
  timeLimitSec?: number;
  space?: SpaceDescriptor;
  palette?: Record<string, string>;
  silhouette?: Record<string, number[][]>;
  arrows: (ArrowPrimitives & { paintRole?: string })[];
}

// Camino ÚNICO fixture -> Level (DRY): lo comparten el seed (validación de
// resolubilidad), el catalog spec y el script de autoría. Incluye space y
// silhouette para construir sobre la geometría correcta (HexSpace /
// HexMaskedSpace); sin ellos un fixture hex caería en RectSpace y sus headDir
// diagonales lanzarían InvalidLevelException.
export function buildLevelFromFixture(fixture: LevelFixture): Level {
  const builder = new LevelBuilder(new LevelId(fixture.levelId))
    .withDimensions(fixture.cols, fixture.rows)
    .withSpace(fixture.space)
    .withSection(fixture.section)
    // number[][] del JSON -> tuplas readonly del dominio (idénticos en runtime).
    .withSilhouette(fixture.silhouette as unknown as LevelSilhouette | undefined)
    .withTimeLimit(fixture.timeLimitSec);
  fixture.arrows.forEach((arrow) => builder.addArrow(arrow));
  return builder.build();
}

// Forma persistida en Level.data. back#60: incluye `space` cuando está
// presente. Para fixtures rect (space ausente) el output es BYTE-IDÉNTICO al de
// antes de back#60 — invariante de no-regresión. Excluye levelId/order/section
// (son columnas de tabla).
export function fixtureToData(fixture: LevelFixture): Prisma.InputJsonValue {
  return {
    cols: fixture.cols,
    rows: fixture.rows,
    ...(fixture.timeLimitSec !== undefined
      ? { timeLimitSec: fixture.timeLimitSec }
      : {}),
    ...(fixture.space !== undefined ? { space: fixture.space } : {}),
    ...(fixture.palette !== undefined ? { palette: fixture.palette } : {}),
    ...(fixture.silhouette !== undefined
      ? { silhouette: fixture.silhouette }
      : {}),
    arrows: fixture.arrows as unknown as Prisma.InputJsonArray,
  };
}

// Sección de catálogo: 'themed'/'hex' literales; cualquier otro valor (o
// ausencia) ⇒ 'campaign'. Espeja LevelBuilder.withSection.
export function resolveSection(fixture: LevelFixture): LevelSection {
  return fixture.section === 'themed' || fixture.section === 'hex'
    ? fixture.section
    : 'campaign';
}

// Presupuesto de tiempo (back#60 D6): mismo s/tap que la campaña (~4.5),
// redondeado a 5s, piso 30s. longitud de solución == nº de flechas.
export function suggestTimeLimitSec(solutionLength: number): number {
  return Math.max(30, Math.round((solutionLength * 4.5) / 5) * 5);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- level-fixture.spec`
Expected: PASS (all cases green).

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/database/level-fixture.ts src/infrastructure/database/level-fixture.spec.ts AI_HISTORY.MD
git commit -m "feat(back): extract testable fixture module with hex space support"
```
(Include an `AI_HISTORY.MD` entry describing the extraction + `space` field.)

---

## Task 2: Wire the seed to the fixture module

**Files:**
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `LevelFixture`, `buildLevelFromFixture`, `fixtureToData`, `resolveSection` from Task 1.
- Produces: seed uses the shared build/serialize/section path; no behavior change for existing levels.

- [ ] **Step 1: Replace the local interface + helpers with module imports**

In `prisma/seed.ts`:
- Delete the local `interface LevelFixture { … }` (lines 21–31) and the `toData` function (lines 89–104).
- Remove the now-unused imports: `LevelBuilder`, `LevelId`, `ArrowPrimitives` (keep `LevelSolver`, the two validators, `Prisma`/`PrismaClient`, `fs`, `path`).
- Add:

```typescript
import {
  LevelFixture,
  buildLevelFromFixture,
  fixtureToData,
  resolveSection,
} from '../src/infrastructure/database/level-fixture';
```

Rewrite `validate` to use the shared builder:

```typescript
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
```

In `main`, replace the `toData`/section lines:

```typescript
      const data = fixtureToData(fixture);
      const order = fixture.order ?? null;
      const section = resolveSection(fixture);
```

Guard the entrypoint so importing the file never triggers a seed:

```typescript
if (require.main === module) {
  main().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}
```

- [ ] **Step 2: Verify compile + module tests still green**

Run: `npx tsc --noEmit -p tsconfig.json && npm test -- level-fixture.spec`
Expected: no type errors; module spec PASS.

- [ ] **Step 3: Verify existing level specs unaffected**

Run: `npm test -- level-solver level.builder`
Expected: PASS (no behavior change).

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts AI_HISTORY.MD
git commit -m "refactor(back): seed builds levels through the shared fixture module"
```

---

## Task 3: Catalog validation spec (DB-free solvability + shape guard)

**Files:**
- Create: `src/infrastructure/database/level-catalog.spec.ts`

**Interfaces:**
- Consumes: `buildLevelFromFixture`, `LevelFixture` (Task 1); `LevelSolver`; `validateLevelPaint`, `validateLevelSilhouette`.
- Produces: a data-driven spec that certifies **every** `prisma/levels/*.json` (solvable + valid paint/silhouette) with no DB — the CI guard behind every authored level.

- [ ] **Step 1: Write the spec (green against the existing 18 levels)**

```typescript
// src/infrastructure/database/level-catalog.spec.ts
import * as fs from 'fs';
import * as path from 'path';
import { LevelSolver } from '../../domain/services/level-solver';
import { LevelFixture, buildLevelFromFixture } from './level-fixture';
import { validateLevelPaint } from './level-paint.validator';
import { validateLevelSilhouette } from './level-silhouette.validator';

// Replica la validación del seed (prisma/seed.ts validate) para TODO el
// catálogo, sin BD: cada fixture se construye sobre su geometría real y el
// solver lo declara soluble; luego los chequeos baratos de paint/silhouette.
// Es el guardián en CI de que ningún nivel autorizado (incl. los hex de #60)
// sea insoluble o tenga metadata rota.
describe('level catalog (all fixtures solvable + valid)', () => {
  const dir = path.join(process.cwd(), 'prisma', 'levels');
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^(level-\d+|t-[a-z0-9-]+|hex-\d+)\.json$/.test(f));
  const solver = new LevelSolver();

  it('finds level fixtures', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s is solvable and shape-valid', (file) => {
    // Arrange
    const fixture = JSON.parse(
      fs.readFileSync(path.join(dir, file), 'utf8'),
    ) as LevelFixture;
    // Act
    const level = buildLevelFromFixture(fixture);
    // Assert
    expect(solver.isSolvable(level)).toBe(true);
    expect(() => validateLevelPaint(fixture)).not.toThrow();
    expect(() => validateLevelSilhouette(fixture)).not.toThrow();
  });
});
```

Note: the filename regex already includes `hex-\d+` so the three free levels are picked up automatically when authored; `t-snowflake` matches `t-[a-z0-9-]+`.

- [ ] **Step 2: Run the spec against the current catalog**

Run: `npm test -- level-catalog.spec`
Expected: PASS for all 18 existing levels (15 campaign + 3 themed). If any fails, STOP — the module wiring (Task 1/2) regressed an existing level.

- [ ] **Step 3: Commit**

```bash
git add src/infrastructure/database/level-catalog.spec.ts AI_HISTORY.MD
git commit -m "test(back): add DB-free catalog spec certifying every level solvable"
```

---

## Task 4: Standalone hex authoring/verification script

**Files:**
- Create: `scripts/verify-hex-level.ts`

**Interfaces:**
- Consumes: `LevelSolver`; `Level`; `LevelFixture`, `buildLevelFromFixture`, `suggestTimeLimitSec` (Task 1).
- Produces: CLI `npx ts-node scripts/verify-hex-level.ts <path>` printing solvability, solution length, suggested `timeLimitSec`, an ASCII hex render, and the removal order. Never touches the DB.

- [ ] **Step 1: Write the script**

```typescript
// scripts/verify-hex-level.ts
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
```

- [ ] **Step 2: Smoke-test the script against a known-solvable hex fixture**

Create a throwaway fixture in the OS temp/scratchpad (NOT under `prisma/levels/`):

```bash
cat > "$TMPDIR/smoke-hex.json" <<'JSON'
{ "levelId": "smoke-hex", "section": "hex", "cols": 5, "rows": 5,
  "space": { "type": "hex", "radius": 2 }, "timeLimitSec": 30,
  "arrows": [ { "id": "arrow-0", "headDir": "up", "cells": [[2, 2], [3, 2]] } ] }
JSON
npx ts-node scripts/verify-hex-level.ts "$TMPDIR/smoke-hex.json"
```

Expected output contains: `SOLVABLE: YES  solutionLength=1` and `Suggested timeLimitSec = 30`, plus a small hex render. Delete the temp file after.

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-hex-level.ts AI_HISTORY.MD
git commit -m "feat(back): add standalone hex level authoring/verification script"
```

---

## Task 5: Author `hex-01` (free, R=3, ~10 arrows)

**Files:**
- Create: `prisma/levels/hex-01.json`

**Interfaces:**
- Consumes: the hex geometry primer (Global Constraints); the verify script (Task 4); the catalog spec (Task 3).
- Produces: `hex-01.json` — section `hex`, R=3, no `order`, timed, solvable.

> **Authoring note (applies to Tasks 5–8):** exact arrow coordinates are produced by the authoring loop, not pre-written in this plan — that is the nature of level content. The plan fully specifies the target, the geometry, the tool, and the acceptance test. Author on grid paper using the primer, then converge with the verify script.

- [ ] **Step 1: Draft the level**

Skeleton (fill `arrows` via the authoring loop):

```jsonc
{
  "levelId": "hex-01",
  "section": "hex",
  "cols": 7, "rows": 7,
  "space": { "type": "hex", "radius": 3 },
  "timeLimitSec": 45,
  "arrows": [
    { "id": "arrow-0", "headDir": "upRight", "cells": [[3, 3], [4, 3]] }
    // …author ~10 multi-cell arrows covering ~68% of the 37 cells, using all
    // 6 directions, varied lengths. Head = cells[0] toward headDir.
  ]
}
```

Targets: **~10 arrows**, all 6 directions represented, ~68% fill, shallow-to-moderate dependency chains.

- [ ] **Step 2: Converge with the verify script**

Run: `npx ts-node scripts/verify-hex-level.ts prisma/levels/hex-01.json`
Iterate the arrows until it prints `SOLVABLE: YES`. Read the reported `solutionLength` and set `timeLimitSec` to the reported `Suggested timeLimitSec` (should land at/near 45 for ~10 arrows).

- [ ] **Step 3: Run the catalog spec**

Run: `npm test -- level-catalog.spec`
Expected: PASS including `hex-01.json`.

- [ ] **Step 4: Commit**

```bash
git add prisma/levels/hex-01.json AI_HISTORY.MD
git commit -m "feat(levels): author hex-01 free hex level (R=3)"
```

---

## Task 6: Author `hex-02` (free, R=4, ~17 arrows)

**Files:**
- Create: `prisma/levels/hex-02.json`

- [ ] **Step 1: Draft** — same shape as Task 5 with `"radius": 4`, `"cols": 9, "rows": 9`, targets **~17 arrows**, ~75% of 61 cells, deeper dependency than hex-01.
- [ ] **Step 2: Converge** — `npx ts-node scripts/verify-hex-level.ts prisma/levels/hex-02.json` until `SOLVABLE: YES`; set `timeLimitSec` to the suggested value (≈75).
- [ ] **Step 3: Catalog spec** — `npm test -- level-catalog.spec` PASS including `hex-02.json`.
- [ ] **Step 4: Commit**

```bash
git add prisma/levels/hex-02.json AI_HISTORY.MD
git commit -m "feat(levels): author hex-02 free hex level (R=4)"
```

---

## Task 7: Author `hex-03` (free, R=5, ~27 arrows)

**Files:**
- Create: `prisma/levels/hex-03.json`

- [ ] **Step 1: Draft** — `"radius": 5`, `"cols": 11, "rows": 11`, targets **~27 arrows**, ~83% of 91 cells, densest of the three with the deepest exit-order chains.
- [ ] **Step 2: Converge** — verify script until `SOLVABLE: YES`; set `timeLimitSec` to the suggested value (≈120).
- [ ] **Step 3: Catalog spec** — `npm test -- level-catalog.spec` PASS including `hex-03.json`.
- [ ] **Step 4: Commit**

```bash
git add prisma/levels/hex-03.json AI_HISTORY.MD
git commit -m "feat(levels): author hex-03 free hex level (R=5)"
```

---

## Task 8: Author `t-snowflake` (themed, R=5 masked, 2 roles)

**Files:**
- Create: `prisma/levels/t-snowflake.json`

**Interfaces:**
- Consumes: geometry primer; verify script; catalog spec. The themed level builds a `HexMaskedSpace` (silhouette = playable frontier).
- Produces: `t-snowflake.json` — section `themed`, `space` hex R=5, `palette` `{core,snow}`, `silhouette` partitioned by role, arrows tessellating the snowflake, solvable.

- [ ] **Step 1: Design the snowflake silhouette**

On the R=5 hexagon (center `[5,5]`), lay out a **6-fold-symmetric snowflake**: center cluster + 6 radial arms (length ~5 along the 6 axes) with side branchlets. Partition cells into two roles:
- `core` → the center cluster cells (`#3B82F6`).
- `snow` → the arm + branchlet cells (`#E8F4FF`).

The snowflake is **fully tessellated by arrows**: `union(silhouette) == union(arrow cells)`. Each arrow's `paintRole` matches the role of the cells it covers (`core` cells → `paintRole:"core"`, arm cells → `paintRole:"snow"`), and `silhouette.core` / `silhouette.snow` list exactly those cell sets.

Skeleton:

```jsonc
{
  "levelId": "t-snowflake",
  "section": "themed",
  "cols": 11, "rows": 11,
  "space": { "type": "hex", "radius": 5 },
  "palette": { "core": "#3B82F6", "snow": "#E8F4FF" },
  "timeLimitSec": 120,
  "arrows": [
    // …author arrows that tessellate the snowflake; head = cells[0] toward headDir;
    // paintRole ∈ {core, snow} matching the cells' role.
  ],
  "silhouette": {
    "core": [ /* center cluster cells [row,col] */ ],
    "snow": [ /* arm + branchlet cells [row,col] */ ]
  }
}
```

- [ ] **Step 2: Converge with the verify script**

Run: `npx ts-node scripts/verify-hex-level.ts prisma/levels/t-snowflake.json`
- The render's `·` marks active-but-unfilled cells and `×` marks inactive-inside-hex cells — iterate until the snowflake reads clearly AND there are no `·` (every silhouette cell is covered by an arrow, i.e. full tessellation).
- Iterate arrows until `SOLVABLE: YES`. Set `timeLimitSec` to the suggested value (explicit time for the themed level — D7 default).

- [ ] **Step 3: Run the catalog spec (paint + silhouette shape included)**

Run: `npm test -- level-catalog.spec`
Expected: PASS including `t-snowflake.json` — this runs `validateLevelSilhouette` (regions ⊆ palette, cells in `11×11` bounds, no dup/overlap, arrows ⊆ union) and `validateLevelPaint`.

- [ ] **Step 4: Commit**

```bash
git add prisma/levels/t-snowflake.json AI_HISTORY.MD
git commit -m "feat(levels): author t-snowflake themed hex level (R=5, masked)"
```

---

## Task 9: e2e — hex catalog + space round-trip

**Files:**
- Create: `test/levels-hex.e2e-spec.ts`

**Interfaces:**
- Consumes: `createTestApp`, `createPrismaServiceMock`, `httpServer`, `PrismaServiceMock` (`test/create-test-app.ts`) — same mocked-Prisma HTTP-contract pattern as `test/levels-themed.e2e-spec.ts`.
- Produces: e2e proving the API serves `space` in the DTO and that hex-section levels carry `section: 'hex'` with no `order`.

- [ ] **Step 1: Write the e2e spec**

```typescript
// test/levels-hex.e2e-spec.ts
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createPrismaServiceMock,
  createTestApp,
  httpServer,
  PrismaServiceMock,
} from './create-test-app';

// e2e del wire hexagonal (back#60, ADR-0007): el descriptor `space` viaja en
// el DTO y la sección 'hex' distingue a los niveles libres de la campaña.
// PrismaService mockeado — contrato HTTP, no BD. Los records deben ser Levels
// válidos: el repositorio los reconstruye vía LevelBuilder al leerlos.
describe('Hex space wire (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaServiceMock;

  const hexRecord = {
    id: 'hex-01',
    order: null,
    section: 'hex',
    data: {
      cols: 7,
      rows: 7,
      space: { type: 'hex', radius: 3 },
      timeLimitSec: 45,
      arrows: [{ id: 'a1', headDir: 'up', cells: [[3, 3], [4, 3]] }],
    },
  };

  const themedHexRecord = {
    id: 't-snowflake',
    order: null,
    section: 'themed',
    data: {
      cols: 11,
      rows: 11,
      space: { type: 'hex', radius: 5 },
      timeLimitSec: 120,
      palette: { core: '#3B82F6', snow: '#E8F4FF' },
      silhouette: { core: [[5, 4]], snow: [[4, 5], [5, 5]] },
      arrows: [
        { id: 'a1', headDir: 'up', cells: [[4, 5], [5, 5]], paintRole: 'snow' },
      ],
    },
  };

  beforeAll(async () => {
    prisma = createPrismaServiceMock();
    app = await createTestApp(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prisma.level.findUnique.mockClear();
    prisma.level.findMany.mockClear();
  });

  it('catalog exposes section "hex" for free hex levels', async () => {
    // Arrange
    prisma.level.findMany.mockResolvedValue([hexRecord]);
    // Act
    const res = await request(httpServer(app)).get('/levels').expect(200);
    // Assert
    expect(res.body).toEqual([{ levelId: 'hex-01', section: 'hex' }]);
  });

  it('serves the hex space descriptor in the level DTO', async () => {
    // Arrange
    prisma.level.findUnique.mockResolvedValue(hexRecord);
    // Act
    const res = await request(httpServer(app)).get('/levels/hex-01').expect(200);
    // Assert
    expect(res.body).toMatchObject({
      levelId: 'hex-01',
      space: { type: 'hex', radius: 3 },
      timeLimitSec: 45,
    });
  });

  it('round-trips a themed hex level with palette, silhouette and space', async () => {
    // Arrange
    prisma.level.findUnique.mockResolvedValue(themedHexRecord);
    // Act
    const res = await request(httpServer(app))
      .get('/levels/t-snowflake')
      .expect(200);
    // Assert
    expect(res.body).toMatchObject({
      levelId: 't-snowflake',
      space: { type: 'hex', radius: 5 },
      palette: { core: '#3B82F6', snow: '#E8F4FF' },
      silhouette: { core: [[5, 4]], snow: [[4, 5], [5, 5]] },
    });
  });
});
```

- [ ] **Step 2: Run the e2e**

Run: `npm run test:e2e -- levels-hex`
Expected: PASS (3 cases). If `space` is absent from the DTO, verify `level.mapper.ts` emits it (it should from #59 — `instanceof HexSpace`).

- [ ] **Step 3: Commit**

```bash
git add test/levels-hex.e2e-spec.ts AI_HISTORY.MD
git commit -m "test(back): add e2e for hex space wire and section"
```

---

## Task 10: Docs + full-suite green

**Files:**
- Modify: `README.md`, `AI_HISTORY.MD`

- [ ] **Step 1: Update README**

In `README.md`, document (architecture/levels section): the hex level catalog (`hex-01/02/03` free + `t-snowflake` themed), that the seed now persists the `space` descriptor, and the authoring tool `scripts/verify-hex-level.ts` (usage line). Keep it to the sections that changed.

- [ ] **Step 2: Consolidate AI_HISTORY**

Ensure each task above has its `AI_HISTORY.MD` entry (contiguous numbering from 088). Add a closing entry summarizing the 4 levels + seed wiring if not already covered per-fragment.

- [ ] **Step 3: Run the full suite**

Run: `npm test && npm run test:e2e && npm run lint:check`
Expected: all unit specs PASS (incl. `level-fixture`, `level-catalog` with 22 levels), all e2e PASS, lint clean (0 errors).

- [ ] **Step 4: Commit**

```bash
git add README.md AI_HISTORY.MD
git commit -m "docs(back): document hex levels, seed space persistence and verify script"
```

---

## Self-Review (against the spec)

- **Spec coverage:** §4 free levels → Tasks 5–7; §5 themed snowflake → Task 8; §6 seed glue → Tasks 1–2; §7 calibration → `suggestTimeLimitSec` (Task 1) applied in Tasks 5–8; §8 verify script → Task 4; §9 tests → Task 1 (unit), Task 3 (catalog/solvability + silhouette/paint via catalog), Task 9 (e2e), Task 2 (rect byte-identical via module test). Idempotency/byte-identical rect covered by the `fixtureToData` byte-identical test (Task 1) + catalog regression (Task 3).
- **Validator bounds:** confirmed NO code change needed — with `cols/rows = 2R+1`, all hex cells fall in `[0, 2R]`, so `validateLevelSilhouette`'s bounds check does not misfire. (Removed from scope vs the spec's tentative §6.5.)
- **Open point §7 resolved:** `t-snowflake` gets an explicit `timeLimitSec` (D7 default), authored via `suggestTimeLimitSec`.
- **Placeholder scan:** the only unfilled content is arrow coordinates in Tasks 5–8, which are inherent level-design output produced by the specified verify-script loop (method + acceptance fully specified), not spec placeholders.
- **Type consistency:** `buildLevelFromFixture` / `fixtureToData` / `resolveSection` / `suggestTimeLimitSec` signatures are used identically in seed (Task 2), catalog spec (Task 3) and script (Task 4).

## Notes for the implementer

- The seed itself needs a live DB to run (`npm run db:seed`); the catalog spec deliberately replicates its validation **without** a DB, so solvability is guaranteed in CI. Running the actual seed against a dev DB is a manual post-merge step for the maintainer.
- Do not commit throwaway authoring fixtures (smoke files) under `prisma/levels/` — the loader and catalog spec would pick them up.
