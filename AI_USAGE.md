# AI Usage Report — MazePruebaBack

This document summarizes how AI tools were used during the development of the ArrowMaze NestJS backend (`MazePruebaBack`), a Clean Architecture REST API (`domain` / `application` / `adapters` / `infrastructure`) backed by PostgreSQL/Prisma. It is a curated summary; the complete, fragment-by-fragment record of every AI-generated change is kept in [AI_HISTORY.MD](AI_HISTORY.MD) (73 entries, Spanish, covering the project from domain bootstrap through authentication, levels, scoring, and themed content).

## Tools Used

| Tool | Version / model identifiers found in the log | Role in the team's workflow |
|---|---|---|
| Claude Code (CLI agent) | Underlying model identified across entries as: unlabeled "opus" (June 2026 entries), "Sonnet 5" (recurring throughout), "Opus 4.8" (from mid-July 2026 onward), and "Fable 5" (an internal build/codename appearing in several July 14–15 entries; the log does not map this name to a public model release, so it is reported here as written) | Primary and, per the project ledger, sole code-generation tool for this artifact. Used both interactively and via structured workflows (skills): `subagent-driven-development` for test-first task execution, `arrowmaze-backend` / `arrowmaze-qa` / `arrowmaze-code-reviewer` as role-scoped directives, `superpowers:executing-plans` / `superpowers:brainstorming` / `superpowers:writing-plans` / `superpowers:receiving-code-review` for planning and review handoffs, and a "multi-agent adversarial review" workflow (multiple review passes with independent verification of each finding) used before opening several pull requests. |

Every one of the 73 entries in `AI_HISTORY.MD` names "Claude Code" as the tool used (confirmed by reading the full log, not assumed). No other AI coding tool appears in the ledger for this repository.

## Usage Log by Task

The 73 entries in `AI_HISTORY.MD` are one-per-fragment and too granular to reproduce here. The following 16 entries were selected as the most representative of the project's lifecycle: initial architecture, a domain-modeling decision that was later discarded, a bug found by review, a full architectural pivot, a live wiring bug invisible to unit tests, a core algorithm and its two subsequent rewrites, a shipped content pipeline, an adversarial review catching design flaws, a regression caught by a human reviewer and the process gap behind it, an audit catching a deployment-breaking migration bug, and a cross-cutting authority change (client-trust to server-trust) for scoring.

### 1. Bootstrap the domain layer (exceptions + Value Objects)
- **Task:** Task 2A.1 — typed exception hierarchy and the first Value Objects (`Position`, `Direction`, `CellType`, `LevelId`, `UserId`, `Email`, `HashedPassword`).
- **AI tool:** Claude Code (`subagent-driven-development`, opus).
- **Prompt:** Implement Task 2A.1 test-first: write failing tests (RED) for the exceptions and VOs, implement them until green, commit with the plan's exact message.
- **Result:** `DomainException` base class with prototype-chain restoration for correct `instanceof`; 8 domain exceptions (one file each); 7 immutable VOs, each validating its own invariant in the constructor. 15 new tests, 16/16 suite green.
- **Team modifications:** None recorded in the log (field left blank).
- **Lessons learned / limitations:** The one-VO-per-invariant convention set here was reused unchanged for every later domain concept (`Score`, `Stars`, `Username`, `ArrowId`, ...). A Jest version mismatch (`--testPathPattern` renamed to `--testPathPatterns`) was hit and logged explicitly rather than silently worked around — a minor but recurring tooling-drift cost.

### 2. Model the board-cell hierarchy (CellFactory)
- **Task:** Task 2A.2 — polymorphic cell entities and their construction via a Factory Method.
- **AI tool:** Claude Code (`subagent-driven-development`, opus).
- **Prompt:** TDD: failing test first, abstract base class plus concrete cell subclasses, implement `CellFactory`, verify green, commit.
- **Result:** Abstract `ICell` with `canBeTraversed()`; four concrete subclasses (`ArrowCell`, `EmptyCell`, `ExitCell`, `WallCell`); `CellFactory.create()` as an exhaustive switch over `CellType` (Factory Method, documented inline per the project's pattern-usage rule).
- **Team modifications:** None recorded.
- **Lessons learned / limitations:** This entire grid/cell model (entries 002–020) was later deleted wholesale during the ADR-0001 architecture pivot (see entry 4 below). Well-tested early domain modeling can still be a sunk cost once the product's real domain shape (arrow-path, not a static grid) becomes clear.

### 3. Fix review findings on already-committed level endpoint
- **Task:** Post-commit review of Task 2A.7 (level HTTP endpoint) surfaced three issues.
- **AI tool:** Claude Code (`subagent-driven-development`, opus).
- **Prompt:** Fix the findings on the already-committed level endpoint: map not-found to HTTP 404 via a reusable exception filter, add the missing controller spec, and address a DRY/OCP violation.
- **Result:** `DomainExceptionFilter` — a global, extensible exception→status registry (`LevelNotFoundException → 404`, default 400, never 500); the missing controller spec was added; a duplicate `NestLoggerAdapter` binding was removed via a new `LoggerModule`; `LevelMapper` switched from `instanceof` to a type discriminant for OCP compliance.
- **Team modifications:** None recorded.
- **Lessons learned / limitations:** The first pass at this controller shipped without exception mapping and without its own spec, despite the project's rule that production code requires accompanying tests. A dedicated review step, not the original generation pass, is what caught it — evidence that even boilerplate-looking adapter code benefits from a second pass.

### 4. ADR-0001 architecture pivot: retire the grid, adopt arrow-path
- **Task:** Fragment 1 of 4 — remove the grid domain model and its consuming pipeline entirely.
- **AI tool:** Claude Code.
- **Prompt:** Execute Fragment 1 of the back#1 plan (issue MazePruebaBack#1): delete the grid model and the level pipeline that consumed it.
- **Result:** 17 files deleted (`ICell` hierarchy, `CellFactory`, `ILevelRepository`, `GetLevelUseCase`, `LevelMapper`, `LevelController`, `LevelModule`, `PrismaLevelRepository`, and their specs); stale comments corrected across `logger`/`auth`/`score`/`progress` modules; suite and build green (117 tests) with the app temporarily serving only auth endpoints.
- **Team modifications:** None recorded.
- **Lessons learned / limitations:** Structuring a large model change as clean, reversible deletion-then-rebuild fragments (this is fragment 1 of 4; fragments 2–4 rebuilt `Direction`, `Arrow`, `Level`, and `ArrowFactory` from scratch) kept a multi-day architectural pivot auditable step by step, rather than as one large, hard-to-review diff.

### 5. Live dependency-injection bug in AuthModule
- **Task:** Fix an `UnknownDependenciesException` discovered while smoke-testing back#5.
- **AI tool:** Claude Code.
- **Prompt:** Not a scoped bug-fix request — surfaced mid-verification ("Postgres is up now" while checking back#5 end-to-end).
- **Result:** `auth.module.ts` injected `JwtService` via the string token `'JwtService'`, but `JwtModule` registers the provider under the class reference, not that string — a bug present since the module's original commit. It was invisible to the full unit suite (183/183 green) because no unit test bootstraps real Nest dependency injection; it only surfaced when `npm run start:dev` was actually run. Fix: `inject: ['JwtService']` → `inject: [JwtService]`.
- **Team modifications:** None recorded.
- **Lessons learned / limitations:** A fully green, fully mocked test suite coexisted with an application that could not start at all. This is the clearest example in the log of a defect category (DI wiring) that the project's mock-heavy unit-testing strategy structurally could not catch.

### 6. Regression test to close the DI-wiring gap
- **Task:** Add the coverage that was missing after the entry-5 fix.
- **AI tool:** Claude Code (roles `arrowmaze-code-reviewer`, `arrowmaze-qa`, `arrowmaze-backend`).
- **Prompt:** "Add what's missing and confirm the module actually works (beyond the tests)."
- **Result:** New `app.module.spec.ts` compiles the entire `AppModule` with `PrismaService` overridden — a real Nest-bootstrap smoke test that had never existed. Verified by mutation: reintroducing the string-token bug makes this new test fail with `UnknownDependenciesException`, proving the test is not tautological. A separate live run confirmed register/login issue real signed JWTs end-to-end.
- **Team modifications:** None recorded.
- **Lessons learned / limitations:** The team's response to a wiring bug was not just a one-line fix but a durable regression test proven non-trivial by deliberately reintroducing the bug — a good practice, but one that required an explicit follow-up prompt rather than being generated automatically alongside the original fix.

### 7. LevelSolver — solvability and canonical Solution (ADR-0002)
- **Task:** Issue back#6 — a domain service that certifies a `Level` can be fully cleared and produces the canonical removal order.
- **AI tool:** Claude Code (plan-driven execution, tests delegated to a QA subagent).
- **Prompt:** Execute the back#6 plan: `LevelSolver` with `solve()`/`isSolvable()`, mirroring the client's exit geometry, deterministic greedy removal by monotonicity.
- **Result:** Pure-domain service with no framework dependencies; 9-case spec covering empty boards, mutual/cyclic blocking, order-dependent removal, and determinism. New glossary terms (`Solvable`, `Solution`) recorded in `CONTEXT.md`.
- **Team modifications:** None recorded.
- **Lessons learned / limitations:** This service, despite a green and reasonably thorough test suite from day one, needed two later structural rewrites for reasons invisible from its own spec: an algorithmic-complexity rewrite (entry 12) and a decoupling of its regression fixtures from live seed data (entry 14). A green suite for a service does not certify that its supporting test fixtures are architecturally sound.

### 8. Curate and seed the 15 campaign levels
- **Task:** Issue back#10 — select 15 levels from 30 generated candidates, freeze them as fixtures, and seed them with guaranteed solvability.
- **AI tool:** Claude Code (handoff-driven execution, `superpowers:executing-plans`).
- **Prompt:** "Read the handoff and execute the plan to resolve GitHub issue #10."
- **Result:** A deterministic selection rule per difficulty tier (lowest-seed/minimal-arrows, lowest-seed/maximal-arrows, remaining lowest-seed); fixtures committed as `prisma/levels/level-01..15.json`; `seed.ts` validates every level's solvability via `LevelBuilder` + `LevelSolver` before writing anything to the database (fail-fast on the whole batch).
- **Team modifications:** None recorded.
- **Lessons learned / limitations:** The fail-fast, whole-batch validation in the seed script was not strictly requested but proved valuable: the same script was reused unchanged through two full campaign re-seeds later in the project (entries with 50×50 boards and themed content) without ever needing to re-derive that safety net.

### 9. Adversarial review before opening the back#3 pull request
- **Task:** Resolve findings from a structured, multi-pass adversarial review of the error-contract and Swagger work (issue back#3) before opening its PR.
- **AI tool:** Claude Code (multi-agent review-plus-verification workflow).
- **Prompt:** "Take issue 3 and develop it [...] only up to the pull request, not the merge."
- **Result:** Three confirmed findings, three fixes: (1) the error filter's response body and the `ErrorResponseDto` Swagger annotation described the same contract with no compile-time link — fixed with a shared `DomainErrorBody` type both sides now implement/type against; (2) a core-layer comment defined `code` in terms of "the public HTTP contract," coupling domain documentation to an adapter concern — reworded to be transport-agnostic; (3) an OpenAPI e2e test only asserted that `ErrorResponseDto` existed somewhere in the schema, not that any endpoint referenced it — a regression that silently dropped the type from an endpoint would have stayed green; a new test pins the exact `$ref` at each of the three endpoints that use it.
- **Team modifications:** None recorded (the findings were resolved within the same session that produced them, prior to any separate human pass).
- **Lessons learned / limitations:** A careful, spec-covered first implementation still produced a type-safety gap and a documentation-coupling issue; only a dedicated, structured second review pass caught them — a concrete illustration that generation and self-review are not substitutes for an independent review step.

### 10. Regression from a human PR review: required field broke an e2e test
- **Task:** back#24 (username feature) — repair a conflict flagged during human review of PR #25.
- **AI tool:** Claude Code (Opus, `superpowers:receiving-code-review` workflow).
- **Prompt:** "There's a new review on PR #25, a conflict was found — please review and fix it."
- **Result:** After merging `main`, `RegisterDto.username` became a required field, but `test/error-contract.e2e-spec.ts` still posted a register request without it; the request now failed validation (400) before reaching the use case, while the test expected 409. The project's CI did not catch this because the workflow ran only the Jest unit suite, not `test:e2e`. Fixed by adding the field both to the request body and to the mocked "existing user" record used by the same test (the repository reconstructs the `Username` VO from that record, so a plain request fix alone was insufficient).
- **Team modifications:** None recorded (the review itself came from a human collaborator on PR #25; the described fix is what Claude Code produced in response).
- **Lessons learned / limitations:** This is a genuine, externally-caught regression: a required-field change silently broke an existing e2e test, and the break stayed invisible to CI purely because of pipeline scope, not because of any code defect. The gap was explicitly flagged as a follow-up rather than fixed in the same fragment.

### 11. Close the CI gap identified in entry 10
- **Task:** Add the e2e suite to the CI gate so this class of regression blocks merges going forward.
- **AI tool:** Claude Code (Opus).
- **Prompt:** "Do both" (add `test:e2e` to CI, and reply to the PR reviewer).
- **Result:** `.github/workflows/ci.yml` gained an E2E step between Test and Build. The required-check job name was deliberately left unchanged to avoid invalidating the branch-protection rule already configured in the repository settings.
- **Team modifications:** None recorded.
- **Lessons learned / limitations:** The symptom (entry 10) and its root cause (this entry) were logged as two distinct, explicitly cross-referenced entries — good traceability — but this also means the CI gap existed in production for the length of one full PR review cycle before being closed.

### 12. LevelSolver rewrite for algorithmic scale (blocking graph, back#30)
- **Task:** Replace an O(A³) greedy replay with a graph-based algorithm ahead of a 50×50/~300-arrow campaign board.
- **AI tool:** Claude Code (build labeled "Fable 5" in the log).
- **Prompt:** "Implement issue #30 end-to-end: LevelSolver over the blocking graph, byte-identical Solutions (snapshot the 15 fixtures before the refactor), a 50×50/≥300-arrow scale test under 250ms, pure domain, no new dependencies."
- **Result:** A one-time occupancy map plus Kahn-style peeling via a min-heap ordered by frozen arrow index replaced the previous per-removal rescan; the public interface (`solve`/`isSolvable`) was left unchanged. A snapshot of the pre-refactor solutions on the 15 curated fixtures was captured and diffed to prove byte-identical output after the rewrite.
- **Team modifications:** None recorded.
- **Lessons learned / limitations:** Snapshotting known-good output before an internal algorithmic rewrite allowed the change to be verified mechanically rather than by code inspection. The same snapshot mechanism, however, is exactly what became a maintenance liability once it was tied to live, mutable seed data instead of frozen fixtures (see entry 14).

### 13. Migration bug caught by post-merge audit (themed Level wire, back#31)
- **Task:** Implement the `Section` + paint-metadata wire for themed levels end-to-end and open its PR.
- **AI tool:** Claude Code (build labeled "Fable 5"; the audit pass that caught the bug is attributed to Claude Code, Opus 4.8).
- **Prompt:** "Implement GitHub issue #31 end-to-end on its own branch and open its PR [...] the paint metadata is opaque."
- **Result:** The schema change (`section` column, `order` made nullable) was implemented and validated only via `npx prisma db push`, without a committed migration file. In the project's real deployment path (`docker-entrypoint.sh` → `prisma migrate deploy` + seed), this meant the `Level` table would never actually gain the `section` column or lose the `order NOT NULL` constraint, while the already-regenerated Prisma Client expected `section` to exist — every level query and the seed step would fail with a P2022 error at deploy time. CI did not catch this because the e2e suite mocks `PrismaService` and never exercises a real migration.
- **Team modifications:** Recorded directly in the log's team-modifications field (unusually, since most entries leave it blank): a follow-up audit added the missing migration file, generated offline via `prisma migrate diff` against the schema-only change, and fixed an unrelated lint nit (`paintRole in palette`, which walks the prototype chain, replaced with `Object.prototype.hasOwnProperty.call`).
- **Lessons learned / limitations:** This is the ledger's clearest concrete example of the mocked-Prisma testing strategy hiding a deployment-breaking defect: a schema change that passed every mocked test could not actually run against the project's real migration-based deployment pipeline.

### 14. Decouple the LevelSolver golden master from live seed data (back#39)
- **Task:** The solver's regression suite read fixtures live from `prisma/levels/*.json`, so every campaign re-seed forced a snapshot recapture — the "frozen" golden master was never actually frozen.
- **AI tool:** Claude Code (Opus 4.8; 9-agent/4-lens adversarial review workflow used before the PR).
- **Prompt:** "Read [the handoff] and carry out issue 39."
- **Result:** Replaced the live-fixture dependency with four static, synthetic fixtures co-located with the spec, independent of `prisma/levels/`. The adversarial review caught one further issue in the same change: the code comment claimed the new synthetic fixtures were "byte-identical to the previous greedy replay" — false, since they had never run under the pre-refactor solver at all. The comment was corrected to describe a forward-only regression guard instead.
- **Team modifications:** None recorded (four other findings raised by the same adversarial pass were reviewed and explicitly discarded as not applicable, with reasons given in the log).
- **Lessons learned / limitations:** A test suite whose fixtures silently depend on mutable, external seed data is not actually pinned even when its assertions look stable — and an incorrect provenance claim in a code comment is a defect class that no test can fail on; only structured review catches it.

### 15. Prove OCP with an executable certification test (BoardSpace, back#36, ADR-0005)
- **Task:** Certify that `LevelSolver` works unmodified against a non-rectangular board space, as the decisive test of the `BoardSpace` abstraction introduced by ADR-0005.
- **AI tool:** Claude Code (build labeled "Fable 5"; test scenarios designed by the architect role, authoring delegated to a QA subagent).
- **Prompt:** "Execute this handoff" (BoardSpace decoupling handoff, back#36).
- **Result:** A certification spec runs the unmodified `LevelSolver` against `HoledRectSpace`, a test-only `BoardSpace` with a hole acting as an additional board boundary, and shows that lanes terminating at the hole behave as if they had reached the board edge — demonstrating Open/Closed compliance as an executable test rather than a design claim in prose. The QA role manually verified expected outputs against the pinned algorithm before running the new tests, which then passed unmodified on the first run.
- **Team modifications:** None recorded.
- **Lessons learned / limitations:** "Prove OCP with a test, don't declare it" is a sound discipline reflected in the log, but its rigor still depended on a manual, human-designed verification of expected values before the test was trusted — the automation did not remove that step, only made it checkable going forward.

### 16. Move score/star computation authority from client to server (ADR-0006, back#A1–A5)
- **Task:** A five-fragment change moving the trust boundary for gameplay scoring: the server now derives `score`/`stars` from raw run metrics instead of accepting client-computed values.
- **AI tool:** Claude Code (Sonnet 5; `backend-architect` and `qa-engineer` roles alternating across fragments, with QA delivering failing tests first in several steps).
- **Prompt:** Representative instruction from the sequence: "Rewrite `SubmitScoreUseCase` so it derives canonical score/stars from run metrics (never trust the client) [...] a mismatch between the client's `previewScore` and the canonical score is logged, never rejected."
- **Result:** `Score.fromRun` / `Stars.rate` Value Objects implement a deterministic multiplicative formula; `Level.timeLimitSec` becomes a mandatory constructor argument; `SubmitScoreUseCase` gained `ILevelRepository` as a dependency and now recomputes score/stars from raw metrics (moves, elapsed time, collisions) rather than trusting client-submitted values; the client's `previewScore` is kept only for divergence logging, never for persistence. A dedicated migration (a later, separate entry) wipes legacy `ScoreEntry` rows computed under the old additive formula, since they are not comparable to the new scores.
- **Team modifications:** None recorded.
- **Lessons learned / limitations:** Moving an authority boundary touched five sequential, interdependent fragments split across two alternating roles; the RED-tests-first handoff between the QA and backend-architect roles kept each fragment individually small and independently verifiable, but the full change could not land as a single atomic commit, and each fragment's `tsc`/test state depended on the previous one landing correctly first.

The complete fragment-by-fragment log lives in [AI_HISTORY.MD](AI_HISTORY.MD).

## Critical Evaluation

### Approximate share of AI-assisted code

All 73 entries in `AI_HISTORY.MD` name Claude Code as the tool that produced the diff, and this repository's `CLAUDE.md` conventions mandate that every significant code fragment go through this workflow with an accompanying ledger entry. On that basis, an honest estimate is that **95–100% of the committed source code, tests, and Prisma schema/seed content in this repository was generated by Claude Code**, not written by hand.

This figure needs a precise qualification of what "AI-assisted" means in this project's actual workflow: the team (a single developer plus, in several entries, a second human reviewer on GitHub PRs) selects which GitHub issue or task to work on, writes or approves the prompt/handoff describing scope and constraints, makes irreversible or judgment-based decisions that the tool does not make on its own (for example: which of 30 generated level candidates to curate into the shipped campaign in entries 032/055/069; when to accept `db push` versus a committed migration; when to merge a PR; how to respond to a human reviewer's comment), and reviews the resulting diff — sometimes through a second, structured adversarial-review pass — before it is committed. "AI-assisted," in this codebase, means the team directs scope, architecture, and review; Claude Code produces the actual diff.

### Cases where AI was wrong or suboptimal

| # | Entry / Issue | What was wrong | How it was caught | Fix |
|---|---|---|---|---|
| 1 | Entry 009 (Task 2A.7 follow-up) | The first implementation of the level HTTP endpoint let `LevelNotFoundException` propagate uncaught, producing HTTP 500 instead of 404; it also shipped without its own controller spec, and the mapper used `instanceof` instead of a type discriminant (OCP violation), with a duplicated logger binding across two modules. | A dedicated post-commit review pass, not the original generation. | Added `DomainExceptionFilter` as a global, extensible exception→status registry; added the missing spec; extracted `LoggerModule`; switched the mapper to a type discriminant. |
| 2 | Entry 029 (AuthModule) | `auth.module.ts` bound `JwtService` under the string DI token `'JwtService'`, but Nest's `JwtModule` registers it under the class reference — the app could not start at all, despite a fully green (183/183) mocked unit suite. | Manual smoke test (`npm run start:dev` + curl), not automated testing — no unit test in the suite bootstraps real Nest DI. | Changed `inject: ['JwtService']` to `inject: [JwtService]`; a dedicated wiring smoke test (`app.module.spec.ts`, entry 030) was added afterward, verified by mutation. |
| 3 | Entry 038 (back#3, pre-PR adversarial review) | The error-response body type and its Swagger DTO annotation described the same contract with no compile-time link (could silently diverge); a domain-layer comment coupled core documentation to an HTTP-specific concern; an OpenAPI e2e test asserted a schema type existed but not that any endpoint actually referenced it. | A structured multi-pass adversarial review, run deliberately before opening the PR. | Introduced a shared `DomainErrorBody` type used by both the filter and the DTO; reworded the domain comment to be transport-agnostic; tightened the e2e test to assert the exact `$ref` at each real usage site. |
| 4 | Entry 044 (back#24, human PR review) | After merging `main`, `RegisterDto.username` became required, but an existing e2e test still posted a register request without it — the request now failed validation (400) instead of reaching the use case and returning the expected 409. | A human reviewer's comment on PR #25 (not CI — the e2e suite was outside the CI pipeline's scope at the time). | Added `username` to both the test's request body and its mocked "existing user" record; separately (entry 045), added `test:e2e` to the CI workflow so this class of regression would be caught automatically going forward. |
| 5 | Entry 053 (back#31, themed Level wire) | The schema change (`section` column, `order` made nullable) was validated only via `prisma db push`, with no committed migration file. Against the project's real deployment path (`migrate deploy` + seed), the database would never actually receive the new column, while the regenerated Prisma Client already expected it — every level query and the seed step would fail with a P2022 error at deploy/CI-adjacent time. Entirely invisible to the mocked-Prisma e2e suite. | A follow-up audit pass (Claude Code, Opus 4.8), explicitly recorded in the log as "Auditoría." | Generated and committed the missing migration offline via `prisma migrate diff`; fixed a related lint issue (unsafe `in` operator over the prototype chain). |

### Team reflection

Claude Code materially accelerated this project: 73 logged fragments across roughly a month produced a full Clean Architecture backend (domain services, an authenticated REST API, a scoring and leaderboard subsystem, procedurally curated and hand-curated level content, a themed-content pipeline, CI, and Docker-based local development) with a parallel unit/e2e test suite that grew from 0 to well over 400 tests without falling behind the production code. The ledger discipline itself — one entry per significant fragment, prompt and result both recorded — made the tool's output auditable in a way that ad hoc AI usage typically is not, and it is what makes this report possible to write honestly rather than from memory.

The concrete limitation the log itself repeatedly surfaces is that the project's testing strategy relies heavily on mocking `PrismaService` and other infrastructure boundaries. This is architecturally sound for isolating unit logic, but it produced a specific, recurring blind spot: at least two defects (entries 029 and 053 above) were invisible to a fully green test suite because the suite never exercised real Nest dependency-injection wiring or a real Prisma migration pipeline, and were only caught by manually running the application or by a dedicated later audit. A second, more procedural limitation is visible in the ledger's own bookkeeping: the "Modificaciones realizadas por el equipo" field — meant to record what a human changed in the AI's output — is left blank or marked "to be filled in manually" in nearly every one of the 73 entries. Read literally, this means the log does not actually capture whether or how a human editor altered the delivered code after the fact, beyond the one entry (053) where a follow-up audit's own changes were logged. Whether that reflects that human edits genuinely were minimal, or that the documentation habit of recording them did not take hold, cannot be determined from the log alone.
