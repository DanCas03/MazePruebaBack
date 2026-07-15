# Curated levels — frozen seed set (back#32, ADR 0003)

The 15 levels seeded into Postgres by `prisma/seed.ts`. Re-produced in full for
the aggressive ramp up to 50×50 (ADR 0003, decision C3 del grilling 2026-07-14),
replacing the gentle back#10 ramp. The candidates come from the front's Dart
production CLI (`MazePruebaFront/tool/level_production`, front#65); human
**Curation** (2026-07-15) picked the final 15.

The campaign keeps its 15 = 5 tiers × 3 structure. Tier 5 splits into two board
profiles: the regular pair (levels 13–14, 42×46) and the **finale** (level 15,
50×50, produced with `--finale`). Dimensions grow non-proportionally; density
climbs across tiers; `timeLimitSec` is derived from the arrow load in tiers 3–5
(the ramp step's **requested** `arrowCount × 4`, ceil to a multiple of 30) and
comes precomputed in the fixture — the back derives nothing. It is uniform per
tier and keyed to the *requested* count, so it is **not** reproducible from the
`arrows` (placed) column below when the generator degraded (levels 13 and 15):
level-13/14 use requested 166 → 690; level-15 uses requested 232 → 930. Strikes
are fixed at 5 elsewhere.

## Provenance

Selection rule: within the uniform tiers 1–4 (every candidate places the full
requested arrow count) pick the lowest three seeds; within tier 5 and the finale
(the self-avoiding walk degrades gracefully, so arrow counts differ) pick the
best-filled — for the finale, the most-crowded well-formed 50×50 in the search.
Order = tier asc, then arrow count asc. Every level passes `LevelSolver`.

Candidates are reproducible byte-for-byte from tier + seed (same Dart SDK):

```
dart run tool/level_production/produce.dart --tier <N> --seeds <S>   # tiers 1–5
dart run tool/level_production/produce.dart --tier 5 --finale --seeds 918   # level 15
```

`arrows` below is the count actually placed in the fixture. Where it is under the
ramp's requested count (tier 5: 166 requested; finale: 232 requested) the
generator degraded gracefully; the fixture is still fully solvable. Do NOT edit
by hand — re-run the CLI and re-curate.

| level | order | source candidate | dims (cols x rows) | arrows | timeLimitSec |
|---|---|---|---|---|---|
| level-01 | 1 | cand-t1-s101 | 6x8 | 6 | - |
| level-02 | 2 | cand-t1-s102 | 6x8 | 6 | - |
| level-03 | 3 | cand-t1-s103 | 6x8 | 6 | - |
| level-04 | 4 | cand-t2-s201 | 10x12 | 13 | - |
| level-05 | 5 | cand-t2-s202 | 10x12 | 13 | - |
| level-06 | 6 | cand-t2-s203 | 10x12 | 13 | - |
| level-07 | 7 | cand-t3-s301 | 18x20 | 36 | 150 |
| level-08 | 8 | cand-t3-s302 | 18x20 | 36 | 150 |
| level-09 | 9 | cand-t3-s303 | 18x20 | 36 | 150 |
| level-10 | 10 | cand-t4-s401 | 30x34 | 94 | 390 |
| level-11 | 11 | cand-t4-s402 | 30x34 | 94 | 390 |
| level-12 | 12 | cand-t4-s403 | 30x34 | 94 | 390 |
| level-13 | 13 | cand-t5-s504 | 42x46 | 163 | 690 |
| level-14 | 14 | cand-t5-s506 | 42x46 | 166 | 690 |
| level-15 | 15 | cand-t5-s918 (finale) | 50x50 | 216 | 930 |

## Themed section (back#31, ADR 0004)

Themed levels (`t-*.json`) live in the `themed` catalog section: no play
order (`order = null`), optional paint instructions (`palette` at the root,
`paintRole` per arrow) served as opaque data. Same solvability guardrail as
campaign levels.

| level | source | dims (cols x rows) | arrows | roles |
|---|---|---|---|---|
| t-heart | front#68 themed tooling — mask `heart`, seed 11, coverage 91% | 16x14 | 23 | heart |
| t-happy-face | front#68 themed tooling — mask `happy_face`, seed 31, coverage face 81% / features 100% | 16x16 | 38 | face, features |
| t-bunny | front#68 themed tooling — mask `bunny`, seed 11, coverage fur 86% / pink 88% / eye 100% | 16x20 | 37 | fur, pink, eye |

The `t-smoke` hand-made placeholder was replaced by the 3 figures above
(front#68). Each fixture is produced by `tool/level_production/produce_themed.dart`
in MazePruebaFront, solvable by construction and re-certified here by
`curated-levels.spec.ts` (LevelSolver + paint consistency).
