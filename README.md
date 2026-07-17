# Arrow Maze — Backend API

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-4169E1?logo=postgresql&logoColor=white)
[![CI](https://github.com/DanCas03/MazePruebaBack/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/DanCas03/MazePruebaBack/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey)

> The CI badge reflects the [GitHub Actions workflow](.github/workflows/ci.yml) on `main`: ESLint, the full Jest suite, and `nest build` run on every pull request; see [Contributing](#contributing).

REST API for **Arrow Maze**, a casual mobile puzzle game. It handles user registration and authentication with JWT, score submission with per-level leaderboards, and cross-device progress sync; serving arrow-path puzzle levels to the Flutter client returns with back#5 (see ADR 0001). The codebase is a study in **Clean Architecture**: the business rules sit in a framework-free core, and NestJS, Prisma, and JWT live at the edges as replaceable details.

## Description

The API exposes four capabilities: registering and authenticating users with JWT, serving hand-curated arrow-path levels, submitting scores with per-level leaderboards, and syncing player progress. The grid-based level pipeline was retired together with the grid domain model (ADR 0001: the snake/arrow-path model is canonical); levels are now served as arrow-path JSON via `GET /levels[/:id]`. What makes it worth reading is not the feature surface but how the layers are kept apart. A use case such as `LoginUseCase` or `SubmitScoreUseCase` is plain TypeScript with zero `@nestjs/*` imports; it depends on interfaces (ports), and the concrete adapters (Prisma repositories, bcrypt, JWT) are injected from the outside. Cross-cutting concerns (request logging, domain-to-HTTP error translation) are handled with aspects, not scattered through controllers.

**Tech stack:** NestJS 11, TypeScript 5.7, Prisma 6 over PostgreSQL, `@nestjs/jwt` + `passport-jwt` + `bcryptjs` for auth, `class-validator` for input validation, Jest for tests.

## Architecture

Clean Architecture with four layers. The dependency rule points inward only: `infrastructure` and `adapters` may depend on `application`, `application` depends on `domain`, and `domain` depends on nothing external.

```
src/
├── domain/          Entities, Value Objects, BoardSpace geometry (space/), domain exceptions — pure TypeScript, no framework
├── application/     Use cases + Ports (interface + DI token per dependency)
├── adapters/        Controllers, DTOs, Mappers, NestJS Modules (DI wiring)
└── infrastructure/  PrismaService, repositories, bcrypt/JWT services, logger adapter

shared/aspects/      LoggingInterceptor + DomainExceptionFilter (AOP, cross-cutting)
```

Why it is organized this way: the inner layers state *what* the system does, the outer layers decide *how*. You can swap Prisma for another ORM, or NestJS for another HTTP framework, by rewriting the outer layers; the use cases and domain rules never change. The litmus test is enforced in code: `grep @nestjs src/application src/domain` returns nothing.

## Design Patterns

Patterns are used where they solve a concrete problem, and each one carries an inline comment explaining why it exists.

| Pattern | Where | Problem it solves |
|---|---|---|
| **Factory Method** | [`arrow.factory.ts`](src/domain/entities/arrow.factory.ts) | Guards the primitives→domain boundary: raw arrow-path JSON (`{ id, headDir, cells }`) becomes a validated `Arrow` — direction parsed case-insensitively, cell shape checked — failing with domain exceptions so no invalid arrow ever enters the system. |
| **Builder** | [`level.builder.ts`](src/domain/entities/level.builder.ts) | Assembles a `Level` from raw arrow-path JSON via a fluent step-by-step API (`withDimensions`/`withTimeLimit`/`addArrow`/`build`), delegating per-arrow parsing to `ArrowFactory` and board invariants to `Level` itself — separates the multi-step assembly process from the validated result. |
| **Template Method** | [`board-space.ts`](src/domain/space/board-space.ts) | Concentrates board geometry behind one seam (ADR 0005): `step` is the only primitive a space defines; `areAdjacent` and `exitLane` derive from it in the abstract base, so a new geometry (holed, 3D) redefines "one step" and every consumer — `Level` validation, `LevelSolver` lanes — works unchanged. `RectSpace` holds the artifact's single direction→delta switch. |
| **Adapter** | [`nest-logger.adapter.ts`](src/infrastructure/logger/nest-logger.adapter.ts), [`jwt-token.service.ts`](src/infrastructure/security/jwt-token.service.ts), [`bcrypt-hash.service.ts`](src/infrastructure/security/bcrypt-hash.service.ts) | Wraps concrete libraries (NestJS `Logger`, `@nestjs/jwt`, `bcryptjs`) behind application ports, so the core never imports them directly. |
| **Strategy (Passport)** | [`jwt.strategy.ts`](src/infrastructure/security/jwt.strategy.ts) | Encapsulates the JWT validation algorithm as a swappable Passport strategy reading its secret from `ConfigService`. |
| **Dependency Injection / Composition Root** | [`auth.module.ts`](src/adapters/auth.module.ts) | `useFactory` instantiates framework-free use cases with their ports, keeping construction out of the business code. |
| **Interceptor (AOP)** | [`logging.interceptor.ts`](src/shared/aspects/logging.interceptor.ts) | Logs every request/response around the handler without touching handlers. |
| **Exception Filter (AOP)** | [`domain-exception.filter.ts`](src/shared/aspects/domain-exception.filter.ts) | Translates domain exceptions to HTTP status codes in one place. |

## SOLID Principles

**Single Responsibility.** Each use case models exactly one operation. [`LoginUseCase`](src/application/use-cases/login.use-case.ts) only authenticates; it does not hash, sign, or talk to a database directly.

```ts
async execute(rawEmail: string, plainPassword: string): Promise<string> {
  const email = new Email(rawEmail);
  const user = await this.userRepo.findByEmail(email);
  if (!user) throw new InvalidCredentialsException('Invalid email or password');
  const valid = await this.hashService.compare(plainPassword, user.password.value);
  if (!valid) throw new InvalidCredentialsException('Invalid email or password');
  return this.tokenService.sign({ sub: user.id.value, email: user.email.value });
}
```

**Open/Closed.** The error-to-HTTP mapping in [`domain-exception.filter.ts`](src/shared/aspects/domain-exception.filter.ts) is extended by adding a registry entry, never by editing the `catch` flow. New exceptions fall through to a safe `400` default instead of leaking a `500`.

```ts
private static readonly statusByException = new Map([
  [LevelNotFoundException, HttpStatus.NOT_FOUND],
  [InvalidCredentialsException, HttpStatus.UNAUTHORIZED],
]); // add a row to extend; the catch() below stays untouched
```

The same discipline covers board geometry: `Level` and `LevelSolver` consume the abstract [`BoardSpace`](src/domain/space/board-space.ts) — `RectSpace` is the only production space, and the test-only `HoledRectSpace` (a grid with holes, where a lane ending at a hole counts as an exit) certifies the seam: [`level-solver.certification.spec.ts`](src/domain/services/level-solver.certification.spec.ts) solves levels over holed geometry without editing a single solver line.

**Liskov Substitution.** Every port implementation is substitutable for its abstraction without the client noticing: `PrismaUserRepository` stands in for `IUserRepository`, `BcryptHashService` for `IHashService`, `JwtTokenService` for `ITokenService` — and the tests swap them for mocks with no change to the use cases.

**Interface Segregation.** Ports are small and focused. [`ILoggerService`](src/application/ports/i-logger.service.ts) exposes three methods (`log`, `error`, `warn`); auth splits into `IUserRepository`, `IHashService`, and `ITokenService` rather than one fat service.

**Dependency Inversion.** Business code depends on abstractions; concretes are injected. `LoginUseCase` receives `IUserRepository`, `IHashService`, and `ITokenService` through its constructor, and `auth.module.ts` binds the tokens to implementations:

```ts
{ provide: TOKEN_SERVICE_TOKEN, useFactory: (jwt) => new JwtTokenService(jwt), inject: ['JwtService'] }
```

## AOP — Cross-Cutting Concerns

Logging and error handling are aspects, kept out of the business logic and applied around it. The strategy is built on Dependency Inversion: both aspects depend on the `ILoggerService` *port* (resolved through `LOGGER_SERVICE_TOKEN`), never on a concrete logger.

- **`LoggingInterceptor`** ([`shared/aspects/logging.interceptor.ts`](src/shared/aspects/logging.interceptor.ts)) logs the inbound request and, via an RxJS `tap`, the outbound response with elapsed time. Registered globally as an `APP_INTERCEPTOR`, so no controller mentions logging.
- **`DomainExceptionFilter`** ([`shared/aspects/domain-exception.filter.ts`](src/shared/aspects/domain-exception.filter.ts)) catches any `DomainException` and maps it to the correct HTTP status, so controllers stay free of `try/catch` and invalid credentials return `401`, not `500`.

```ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject(LOGGER_SERVICE_TOKEN) private readonly logger: ILoggerService) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    const { method, url } = context.switchToHttp().getRequest();
    const start = Date.now();
    this.logger.log(`→ ${method} ${url}`, LoggingInterceptor.name);
    return next.handle().pipe(tap(() =>
      this.logger.log(`← ${method} ${url} (${Date.now() - start}ms)`, LoggingInterceptor.name)));
  }
}
```

## API Endpoints

Interactive OpenAPI documentation (Swagger UI) is served at **`/api`**; the raw
OpenAPI 3 document is available at **`/api-json`**. Both are generated at
bootstrap from the controllers' decorators via `DocumentBuilder` (`src/app.setup.ts`).

| Method | Path                  | Auth | Description                          |
|--------|-----------------------|------|--------------------------------------|
| POST   | `/auth/register`      | No   | Register a user with a unique `email` + `username`; returns a JWT |
| POST   | `/auth/login`         | No   | Authenticate a user; returns a JWT   |
| GET    | `/auth/me`            | Yes  | Return the authenticated user's basic profile (`id`, `username`, `email`) |
| GET    | `/levels`             | No   | List the level catalog with each level's `section`: campaign in play order, then themed by id |
| GET    | `/levels/:id`         | No   | Get a level as arrow-path JSON; themed levels carry opaque paint instructions (`palette` + per-arrow `paintRole`) |
| GET    | `/levels/:id/solution` | No  | Clearing Solution for a level: arrow ids in removal order (422 if unsolvable) |
| POST   | `/scores`             | Yes  | Submit a completed run's metrics; the back derives the canonical `score`/`stars` (404 if the level does not exist) |
| GET    | `/leaderboard`        | Yes  | Global player ranking: best-per-level campaign totals, `{top, me}` (`me` = requesting user's row or `null`) |
| GET    | `/leaderboard/:levelId` | No | Top scores for a level, with each row's `username` resolved (desc, default limit 10, max 100) |
| POST   | `/progress`           | Yes  | Sync completed levels + best scores (merges, never degrades) |
| GET    | `/progress`           | Yes  | Get the authenticated user's progress |

> The `order` on a `Level` record is an explicit, curatable sequence (not insertion order) — the curated 15-level seed (back#10) controls it directly. Since back#31 (ADR 0004) `order` is nullable and a `section` column splits the catalog: **campaign** levels keep the contiguous play order, **themed** levels (figure boards) have no play order and are listed after the campaign, sorted by id. Paint metadata is opaque to the backend: it never affects mechanics, solvability, or the Solution.

```jsonc
// POST /auth/register → 201
// body: { "email": "player@arrowmaze.com", "username": "player_01", "password": "sup3rs3cret" }
// username: 3-20 chars, letters/digits/underscore only, unique (409-ish 400 via DomainExceptionFilter if taken)
// POST /auth/login → 200
{ "token": "<jwt>" }

// GET /auth/me → 200 (Authorization: Bearer <jwt>)
{ "id": "user-uuid-1", "username": "player_01", "email": "player@arrowmaze.com" }

// GET /levels → 200 (campaign in play order, then themed by id)
[{ "levelId": "l-007", "section": "campaign" }, { "levelId": "t-smoke", "section": "themed" }]

// GET /levels/:id → 200 (arrow-path wire contract, CONTEXT-MAP.md)
{
  "levelId": "l-007",
  "cols": 8,
  "rows": 11,
  "timeLimitSec": 90,
  "arrows": [
    { "id": "a1", "headDir": "up", "cells": [[10, 3], [9, 3], [9, 4]] },
    { "id": "a2", "headDir": "right", "cells": [[2, 0], [2, 1]] }
  ]
}
// GET /levels/:id → 200 for a THEMED level (ADR 0004): same contract plus
// opaque paint instructions — a root palette (role → #RRGGBB) and an
// optional paintRole per arrow. They do not affect mechanics or solvability.
{
  "levelId": "t-smoke",
  "cols": 6,
  "rows": 6,
  "palette": { "cara": "#FBBF24", "ojo": "#1E293B" },
  "arrows": [
    { "id": "a1", "headDir": "up", "cells": [[1, 1], [1, 2]], "paintRole": "ojo" }
  ]
}
// GET /levels/:id → 404 when the id does not exist

// GET /levels/:id/solution → 200 (arrow ids in clearing order; works for
// campaign and themed alike) — 422 UNSOLVABLE_LEVEL if no solution exists
{ "levelId": "t-smoke", "solution": ["a1", "a2", "a3"] }

// POST /scores (Bearer token required) → 201 (ADR 0006: the back is the sole
// scoring authority — it derives score/stars from the run metrics, it never
// accepts a client-computed value)
// body: { "levelId": "level-07", "moves": 12, "timeSeconds": 45, "collisions": 1, "previewScore": 5240 }
{ "score": 1200, "stars": 3 }
// previewScore is the client's optimistic estimate, contrast-only: a mismatch
// against the canonical score is logged server-side, never rejected (400).
// POST /scores → 404 when levelId does not exist; → 400 when a required
// metric (e.g. collisions) is missing or invalid.

// GET /leaderboard/:levelId?limit=10 → 200 (each row includes the player's username)
[{ "id": "...", "userId": "...", "username": "player_01", "levelId": "level-07", "score": 1200, "stars": 3, "moves": 12, "timeSeconds": 45, "createdAt": "..." }]

// POST /progress (Bearer token required) → 201
// body: { "levels": [{ "levelId": "level-07", "completed": true, "bestScore": 1200, "bestStars": 3 }] }
[{ "levelId": "level-07", "completed": true, "bestScore": 1200, "bestStars": 3 }]

// GET /progress (Bearer token required) → 200
[{ "levelId": "level-07", "completed": true, "bestScore": 1200, "bestStars": 3 }]

// Error shape for every domain exception (produced by DomainExceptionFilter)
// `code` is the stable machine-readable identifier — clients discriminate on
// it, never on `message`.
{ "statusCode": 401, "code": "INVALID_CREDENTIALS", "message": "Invalid email or password" }
```

Domain exceptions map to status codes as follows: `LevelNotFoundException → 404`, `InvalidCredentialsException → 401`, `UserAlreadyExistsException → 409`, any other `DomainException → 400` (never 500).

## Getting Started

### Prerequisites

- Node.js >= 20 and npm
- A PostgreSQL instance

### Environment variables

Create a `.env` file at the project root (copy `.env.example` as a starting point):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="7d"
PORT=3000
```

| Variable          | Required | Description                                  |
|-------------------|----------|----------------------------------------------|
| `DATABASE_URL`    | Yes      | PostgreSQL connection string (Prisma format) |
| `JWT_SECRET`      | Yes      | Secret used to sign and verify JWTs          |
| `JWT_EXPIRATION`  | No       | Token lifespan (defaults to `7d`)            |
| `PORT`            | No       | HTTP port (defaults to `3000`)               |

### Install and run

```bash
npm install
npx prisma migrate dev      # create the schema (User, Level) in your database
npm run start:dev           # watch mode at http://localhost:3000
```

> **Existing database created with `prisma db push`?** It has no `_prisma_migrations` table, so `migrate dev`/`migrate deploy` will try to re-create tables that already exist. Baseline it once and migrations work normally from there on:
>
> ```bash
> npx prisma migrate resolve --applied 20260714134255_init
> ```

### Docker (recommended for local dev)

No Node.js or PostgreSQL install required — see `../README-docker.md` at the project root for the full stack (backend + frontend + database):

```bash
cd ..
docker compose up --build
```

The backend container applies migrations and seeds the curated levels automatically on every start. The API serves CORS headers so the dockerized web front (running in the host's browser on another port, i.e. cross-origin) can call it.

### Seeding levels

The game ships with **15 curated campaign levels** (`level-01`…`level-15`) on a 9:16 portrait difficulty ramp (back#46): five tiers of three that climb from a **6×10 opener** to a **28×50 near-full-coverage finale** (~0.77 density), every board's `cols/rows` ratio held within the `[0.53, 0.68]` aspect band, and board size and density rising each tier. **All 15 levels are timed** (30/90/120/270/480/720s per tier) — unlike the previous ramp (ADR 0003), which left the first two tiers without a clock. They are frozen as arrow-path fixtures in [`prisma/levels/`](prisma/levels) (produced by the front's `tool/level_production` CLI and human-curated — see [`prisma/levels/manifest.md`](prisma/levels/manifest.md)) and seeded with an explicit play order, plus the **themed** fixtures (`t-*.json`, ADR 0004) seeded without play order and carrying opaque paint instructions. Every level — campaign or themed — is guaranteed solvable by the domain `LevelSolver`.

```bash
npm run db:seed     # upsert the curated + themed levels into the database
```

Requires a reachable `DATABASE_URL` with the schema already migrated (`npx prisma migrate dev`). The seed is:

- **Idempotent** — it upserts by level id, so re-running it never duplicates rows and preserves ids referenced by scores and progress.
- **Fail-fast** — before writing anything it rebuilds each level and asserts board invariants and solvability, aborting the whole batch if any fixture is invalid. Themed fixtures additionally pass a cheap paint-consistency check (every `paintRole` exists in the `palette`, colors are `#RRGGBB`) — the only validation the backend applies to the otherwise opaque paint metadata.
- **Automatic on reset** — configured via `migrations.seed` in `prisma.config.ts`, so `prisma migrate dev` / `prisma migrate reset` run it for you after applying migrations.

See [`prisma/levels/manifest.md`](prisma/levels/manifest.md) for the provenance of each level and the deterministic selection rule.

**Leaderboard reset (back#46):** the campaign ids (`level-01`…`level-15`) keep their identity across the 9:16 reshape, but the boards behind them changed, so prior `ScoreEntry` rows scored against the old shapes no longer mean anything. Migration [`20260716140000_wipe_campaign_scores_9_16_reshape`](prisma/migrations/20260716140000_wipe_campaign_scores_9_16_reshape/migration.sql) deletes those rows (leaving `Progress` completion flags untouched) so the campaign leaderboard starts clean against the reseeded fixtures.

## Running Tests

```bash
npm test            # unit tests (Jest, AAA, mocked dependencies) — 263 tests
npm run test:cov    # with coverage
npm run test:e2e    # end-to-end HTTP contract against mocked Prisma (error body, OpenAPI, solution, CORS)
```

Unit tests isolate the unit under test by mocking its ports, so the suite runs without a real database.

## AI Usage Documentation

This codebase was built with AI assistance (Claude Code), and every significant fragment is logged in [`AI_HISTORY.MD`](AI_HISTORY.MD) at the repository root. Each entry records the task, the tool used, the prompt, the resulting design decisions, and a field reserved for manual edits by the team. Read that file to trace how — and why — each module came to exist, sublote by sublote, from project setup through the auth backend.

## Contributing

- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <description>` in the imperative present, one significant fragment per commit (for example, `feat(back/application): add LoginUseCase`).
- **Branching**: feature work happens on a `feat/<name>` branch cut from `main`; this milestone lives on `feat/main-sprint`.
- **Pull requests**: open a PR against `main`, ensure `npm test` and `npm run build` are green, and update `AI_HISTORY.MD` (and this README when public behavior changes) as part of the change.
- **CI**: every pull request runs the [`CI` workflow](.github/workflows/ci.yml) (`npm run lint:check` + `npm test` + `npm run build` on Node 22); merging to `main` requires the `CI / lint · test · build` check to be green (branch protection is configured in Settings → Branches). Run the same three commands locally to reproduce the gate.

## License

This is a private academic project; `package.json` declares it `UNLICENSED`, so no usage rights are granted by default. If the project is later opened up, add a `LICENSE` file (MIT is a sensible default) and update this section.
