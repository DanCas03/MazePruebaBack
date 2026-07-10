# Curated levels — frozen seed set (back#10)

The 15 levels seeded into Postgres by `prisma/seed.ts`, curated from the 30
frozen generator candidates in `MazePruebaFront/tool/candidates` (front#1).

Selection is deterministic (ADR 0001 dec. 5): per tier, of the solvable
candidates pick the lowest-seed min-arrow-count, the lowest-seed
max-arrow-count, and the lowest-seed remaining; order = tier asc, then arrow
count asc. Every level passes `LevelSolver`. Re-running the freeze yields the
same 15 bytes. Do NOT edit by hand.

| level | order | source candidate | dims (cols x rows) | arrows | timeLimitSec |
|---|---|---|---|---|---|
| level-01 | 1 | cand-t1-s101 | 6x8 | 5 | - |
| level-02 | 2 | cand-t1-s102 | 6x8 | 5 | - |
| level-03 | 3 | cand-t1-s104 | 6x8 | 6 | - |
| level-04 | 4 | cand-t2-s201 | 7x10 | 7 | - |
| level-05 | 5 | cand-t2-s202 | 7x10 | 7 | - |
| level-06 | 6 | cand-t2-s204 | 7x10 | 8 | - |
| level-07 | 7 | cand-t3-s301 | 8x11 | 9 | - |
| level-08 | 8 | cand-t3-s302 | 8x11 | 9 | - |
| level-09 | 9 | cand-t3-s305 | 8x11 | 11 | - |
| level-10 | 10 | cand-t4-s401 | 9x13 | 12 | 120 |
| level-11 | 11 | cand-t4-s402 | 9x13 | 12 | 120 |
| level-12 | 12 | cand-t4-s405 | 9x13 | 14 | 120 |
| level-13 | 13 | cand-t5-s501 | 11x15 | 15 | 180 |
| level-14 | 14 | cand-t5-s502 | 11x15 | 15 | 180 |
| level-15 | 15 | cand-t5-s505 | 11x15 | 18 | 180 |
