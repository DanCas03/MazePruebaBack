# Curated levels — frozen seed set (back#46, 9:16 all-timed reshape)

The 15 levels seeded into Postgres by `prisma/seed.ts`. Reproduced in full for
the 9:16 portrait reshape (back#46): every board now targets a `cols/rows`
ratio in `[0.53, 0.68]` (the front's `AspectBand`, source of truth in
`MazePruebaFront`) instead of the wider bands used by the previous ramp. The
candidates come from the front's Dart production CLI
(`MazePruebaFront/tool/level_production`); human curation (Task 4b/5, front
side of back#46) picked the final 15.

The campaign keeps its 15 = 5 tiers × 3 structure. Tier 5 splits into two board
profiles: the regular pair (levels 13–14, 25×44) and the **finale** (level 15,
28×50, produced with `--finale`, near-full coverage at ~0.77 density).
Dimensions grow non-proportionally within the 9:16 band; density climbs across
tiers. **All 15 levels are now timed** (the prior ramp left orders 1–6
untimed; this reshape adds a clock to every tier, starting at 30s for the
opener). `timeLimitSec` is precomputed in the fixture — the back derives
nothing.

## Provenance

Selection rule: within the uniform tiers 1–4 (every candidate places the full
requested arrow count) pick the lowest three seeds; within tier 5 and the
finale (the self-avoiding walk degrades gracefully, so arrow counts can
differ) pick the best-filled. Order = tier asc, then arrow count asc. Every
level passes `LevelSolver`. Orders 13/14 were re-picked from the 901..925 pool
(excluding seed 924, already claimed by the order-15 finale) by exact density,
taking the two densest remaining seeds — see the Task 5 staging manifest for
the full collision-fix note.

Candidates are reproducible byte-for-byte from tier + seed (same Dart SDK):

```
dart run tool/level_production/produce.dart --tier <N> --seeds <S>   # tiers 1-5
dart run tool/level_production/produce.dart --tier 5 --finale --seeds 924   # level 15
```

`arrows` below is the count actually placed in the fixture; for this reshape
every chosen candidate placed the full requested count (no degraded
placement). Do NOT edit fixtures by hand — re-run the CLI and re-curate.

| level | order | source | dims (cols x rows) | arrows | timeLimitSec |
|---|---|---|---|---|---|
| level-01 | 1 | tier 1, seed 104 | 6x10 | 7 | 30 |
| level-02 | 2 | tier 1, seed 101 | 6x10 | 7 | 30 |
| level-03 | 3 | tier 1, seed 103 | 6x10 | 7 | 30 |
| level-04 | 4 | tier 2, seed 107 | 9x16 | 16 | 90 |
| level-05 | 5 | tier 2, seed 101 | 9x16 | 16 | 90 |
| level-06 | 6 | tier 2, seed 105 | 9x16 | 16 | 90 |
| level-07 | 7 | tier 3, seed 104 | 12x22 | 26 | 120 |
| level-08 | 8 | tier 3, seed 103 | 12x22 | 26 | 120 |
| level-09 | 9 | tier 3, seed 105 | 12x22 | 26 | 120 |
| level-10 | 10 | tier 4, seed 105 | 19x34 | 67 | 270 |
| level-11 | 11 | tier 4, seed 112 | 19x34 | 67 | 270 |
| level-12 | 12 | tier 4, seed 111 | 19x34 | 67 | 270 |
| level-13 | 13 | tier 5 regular, seed 916 | 25x44 | 118 | 480 |
| level-14 | 14 | tier 5 regular, seed 901 | 25x44 | 118 | 480 |
| level-15 | 15 | tier 5 finale, seed 924 | 28x50 | 180 | 720 |

## Reproduction commands

```
# level-01  (tier 1, seed 104)
dart run tool/level_production/produce.dart --tier 1 --seeds 104

# level-02  (tier 1, seed 101)
dart run tool/level_production/produce.dart --tier 1 --seeds 101

# level-03  (tier 1, seed 103)
dart run tool/level_production/produce.dart --tier 1 --seeds 103

# level-04  (tier 2, seed 107)
dart run tool/level_production/produce.dart --tier 2 --seeds 107

# level-05  (tier 2, seed 101)
dart run tool/level_production/produce.dart --tier 2 --seeds 101

# level-06  (tier 2, seed 105)
dart run tool/level_production/produce.dart --tier 2 --seeds 105

# level-07  (tier 3, seed 104)
dart run tool/level_production/produce.dart --tier 3 --seeds 104

# level-08  (tier 3, seed 103)
dart run tool/level_production/produce.dart --tier 3 --seeds 103

# level-09  (tier 3, seed 105)
dart run tool/level_production/produce.dart --tier 3 --seeds 105

# level-10  (tier 4, seed 105)
dart run tool/level_production/produce.dart --tier 4 --seeds 105

# level-11  (tier 4, seed 112)
dart run tool/level_production/produce.dart --tier 4 --seeds 112

# level-12  (tier 4, seed 111)
dart run tool/level_production/produce.dart --tier 4 --seeds 111

# level-13  (tier 5 regular, seed 916 — collision-fix pick, excludes 924)
dart run tool/level_production/produce.dart --tier 5 --seeds 916

# level-14  (tier 5 regular, seed 901 — collision-fix pick, excludes 924)
dart run tool/level_production/produce.dart --tier 5 --seeds 901

# level-15  (tier 5 finale, seed 924)
dart run tool/level_production/produce.dart --tier 5 --finale --seeds 924
```

## Themed section (back#31, ADR 0004)

Themed levels (`t-*.json`) live in the `themed` catalog section: no play
order (`order = null`), optional paint instructions (`palette` at the root,
`paintRole` per arrow) served as opaque data. Same solvability guardrail as
campaign levels. Untouched by back#46 — the 9:16 reshape only affects the
campaign fixtures.

| level | source | dims (cols x rows) | arrows | roles |
|---|---|---|---|---|
| t-heart | front#68 tooling, regenerated at higher mask resolution (back#47) — mask `heart`, seed 74, coverage 82% | 24x16 | 51 | heart |
| t-happy-face | front#68 tooling, regenerated at higher mask resolution (back#47) — mask `happy_face`, seed 94, coverage face 72% / features 86% | 24x22 | 72 | face, features |
| t-bunny | front#68 themed tooling — mask `bunny`, seed 11, coverage fur 86% / pink 88% / eye 100% | 16x20 | 37 | fur, pink, eye |

The `t-smoke` hand-made placeholder was replaced by the 3 figures above
(front#68). Each fixture is produced by `tool/level_production/produce_themed.dart`
in MazePruebaFront, solvable by construction and re-certified here by
`curated-levels.spec.ts` (LevelSolver + paint consistency).
