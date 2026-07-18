# Spec — back #59: HexSpace + HexMaskedSpace + descriptor wire `space` + sección `hex`

**Fecha:** 2026-07-18 · **Issue:** back #59 · **ADR:** 0007 (D1/D4/D5) · **Depende de:** #58 (PR #61, rama base `feat/58-direction-8-values`)

## Objetivo

Núcleo del módulo hexagonal: espacio hex flat-top como nueva estrategia `BoardSpace`, su gemelo enmascarado, declaración explícita de geometría en el wire y la sección de producto `hex`. Sin tocar solver, `exitLane`, `areAdjacent` ni el VO `Position`.

## Decisiones de brainstorming (2026-07-18)

1. **DTO de salida:** `cols`/`rows` siempre presentes = bounding box ((2R+1)² en hex, ya lo calcula `Level` desde `space.allCells()`); `space` es campo adicional opcional. Retrocompatibilidad byte a byte sin `space`.
2. **Cableado masked en #59:** el builder construye `HexMaskedSpace` cuando el wire trae `space: hex` + `silhouette`. #60 queda como puro seed de datos (salvo validador, ver 4).
3. **Semántica de silueta en hex = frontera jugable:** en hex la silueta recorta el espacio (la flecha sale al abandonar la figura). Asimetría consciente con rect+themed (donde la silueta es solo visual y el espacio es el rect completo); se documenta en CONTEXT.md.
4. **Wire `space`:** solo `{type:'hex', radius}` con radius entero ≥1; ausente ⇒ rect `cols×rows`; cualquier otra forma ⇒ excepción fail-fast al construir. `type:'rect'` explícito NO se admite (YAGNI). Con `space` presente, `cols`/`rows` del wire se ignoran.
5. **`validateLevelSilhouette` hex-aware:** se difiere a #60, junto al seed que lo ejercita.

## Diseño

### 1. `src/domain/space/hex-space.ts`
`HexSpace extends BoardSpace`, `constructor(readonly radius: number)`; radius entero ≥1 o `InvalidBoardSpaceException`.

- Axiales sobre `Position(row,col)` sin tocar el VO: `q = col − R`, `r = row − R` (col = q+R, row = r+R, no-negativas).
- `contains(pos)`: `|q| ≤ R ∧ |r| ≤ R ∧ |q+r| ≤ R`.
- `cellCount = 3R² + 3R + 1`.
- `allCells()`: orden canónico row-major sobre el bounding box (2R+1)², filtrado por `contains`.
- `directions`: exactamente 6, congelados — `up, down, upRight, downRight, upLeft, downLeft` (sin `left`/`right`).
- `step(pos, dir)`: switch exhaustivo de 8 casos. Deltas (drow, dcol): up (−1,0), down (+1,0), upRight (−1,+1), downRight (0,+1), upLeft (0,−1), downLeft (+1,−1). `left`/`right` ⇒ `InvalidDirectionException`; `default:` tipado `never` como tripwire. Devuelve `null` fuera del hex (frontera). Mismo contrato que RectSpace tras #58.
- `exitLane` y `areAdjacent` heredados (Template Method sobre `step`).

### 2. `src/domain/space/hex-masked-space.ts`
`HexMaskedSpace extends HexSpace`, `constructor(radius, active: readonly Position[])`. Espejo deliberado del patrón de `HoledRectSpace` pero con set de **activas** (brief) — NO decorador (deuda ADR-0007 D5).

- Set interno de claves `"row,col"`. Único override: `contains(pos) = super.contains(pos) && activeSet.has(key)`.
- Invariantes de construcción: set no vacío; toda activa dentro del hex base (`super.contains`), si no `InvalidBoardSpaceException`.
- Vive en producción (`src/domain/space/`, no `testing/`): el builder la instancia.

### 3. Wire + builder
- `LevelDataPrimitives` (repo Prisma) gana `space?: { type: 'hex'; radius: number }`.
- `LevelBuilder.withSpace(descriptor?)`:
  - ausente ⇒ `RectSpace(cols, rows)` como hoy;
  - `{type:'hex', radius válido}` sin silhouette ⇒ `HexSpace(radius)`;
  - `{type:'hex', ...}` + `silhouette` ⇒ `HexMaskedSpace(radius, unión de las regiones de la silueta)`;
  - cualquier otra forma (type desconocido, radius no entero o <1) ⇒ excepción de dominio.
- `PrismaLevelRepository.toDomain` encadena `withSpace(record.data.space)`.
- El builder sigue siendo de los únicos puntos que instancian espacios concretos.

### 4. Mapper/DTO
- `LevelResponseDto` gana `space?: { type: 'hex'; radius: number }`, documentado como opcional/retrocompatible.
- `LevelMapper.toDto`: emite `space` si `level.space instanceof HexSpace` (con su `radius`); en rect no emite el campo. `cols`/`rows` sin cambio (bounding box ya derivado en `Level`).

### 5. Sección `hex`
- `LevelSection = 'campaign' | 'themed' | 'hex'` (`level.entity.ts`).
- `LevelBuilder.withSection` normaliza también `'hex'` (resto ⇒ campaign, como hoy).
- Ortogonal a la geometría: el temático hexagonal de #60 será `themed` + space hex.

### 6. Tests (AAA) y golden master
- `hex-space.spec.ts`: contains (centro, 6 vértices, fuera), cellCount R=1..5 vs fórmula, step 6 direcciones + frontera, `left`/`right` ⇒ `InvalidDirectionException`, exitLane heredado en caso diagonal, areAdjacent heredado, radius inválido.
- `hex-masked-space.spec.ts`: contains restringido, invariantes de construcción, exitLane que termina en el borde de la máscara.
- `board-space.contract.spec.ts`: la ley del contrato corre también contra `HexSpace` y `HexMaskedSpace`.
- Builder: descriptor ausente/válido/inválido, hex+silhouette ⇒ masked, cols/rows ignorados con space.
- Mapper: con y sin `space` (retrocompat exacta).
- Solver sin cambios: `solve` resuelve un hex sintético resoluble y devuelve `null` en uno irresoluble.
- Golden master: `characterization-fixtures.json` gana campo `space` opcional y un fixture hex sintético con su snapshot (`toHaveLength` 4→5); los 4 previos sin diff.

### 7. Fuera de alcance
Seed de niveles hex reales y temático hex (#60), `validateLevelSilhouette` hex-aware (#60), decorador de máscaras (deuda D5), artefacto front (#124–#127), generador procedimental hex.

## Proceso
Glosario CONTEXT.md del back («Espacio hexagonal (HexSpace)», sección `hex`) dentro de la PR. AI_HISTORY desde 081. Commits por fragmento (Conventional Commits). Rama `feat/59-hex-space` sobre `feat/58-direction-8-values` (se rebasa/mergea a main cuando entre PR #61).
