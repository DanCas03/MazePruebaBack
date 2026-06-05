# Historial de cambios — Backend (NestJS)

Bitácora **detallada y por pasos** de la construcción de la API. Complementa el
`AI_HISTORY.MD` de la raíz con el detalle técnico específico del repositorio.

> Convención de fechas: el proyecto se desarrolló sobre la fecha base 2026-06-04.

---

## Hito 1 — Scaffold inicial (previo)

Proyecto NestJS 11 inicializado; dependencias instaladas (`@prisma/client`,
`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `@nestjs/config`, `bcryptjs`,
`class-validator`, `class-transformer`); Prisma inicializado (PostgreSQL); carpetas
de Clean Architecture creadas; `.env` con `DATABASE_URL`, `JWT_SECRET`, `PORT`.
Estado de partida: solo el boilerplate (`GET /`).

---

## Hito 2 — Sprint "Clean Architecture + DDD + AOP"

Implementación de la base del backend siguiendo Clean Architecture, SOLID, GoF,
DDD (Value Objects) y AOP. Todos los pasos siguen el patrón AAA para ser testeables.

### Paso 2.1 — Excepciones de dominio
- `src/domain/exceptions/domain.exception.ts` — `DomainException` base (sin NestJS).
- Específicas: `invalid-position`, `invalid-direction`, `unknown-cell-type`,
  `invalid-email`, `invalid-uuid`, `level-not-found`.

### Paso 2.2 — Value Objects
- `src/domain/value-objects/`: `Position`, `Direction`, `CellType`, `LevelId`,
  `UserId`, `Email`, `HashedPassword`.
- Patrón: constructor privado + factory `of()`/`fromHash()` que valida invariantes y
  lanza la excepción de dominio correspondiente. `HashedPassword` solo se construye
  desde un hash y su `toString()` devuelve `[REDACTED]`.

### Paso 2.3 — Entidades de celda + Factory Method
- `src/domain/entities/cell.entity.ts` — `ICell` abstracta (OCP/LSP) con `Position`
  y `CellType` (VOs).
- `arrow-cell` (rotate inmutable), `wall-cell`, `empty-cell`, `exit-cell`.
- `cell.factory.ts` — `CellFactory.create(type, position, direction?)`
  (Factory Method); recibe VOs ya validados, nunca strings crudos.

### Paso 2.4 — Puertos (Application)
- `src/application/ports/i-logger.service.ts` — `ILoggerService` + token
  `LOGGER_SERVICE`.
- `src/application/ports/i-level.repository.ts` — `ILevelRepository` (`findById(id:
  LevelId)`) + token `LEVEL_REPOSITORY` + `LevelDto` (forma plana).

### Paso 2.5 — Adapter de logging + AOP
- `src/infrastructure/logger/nest-logger.adapter.ts` — `NestLoggerAdapter`
  implementa `ILoggerService` envolviendo el `Logger` de NestJS (Patrón Adapter).
- `src/shared/aspects/logging.interceptor.ts` — `LoggingInterceptor` (AOP): registra
  entrada/salida/duración/errores; recibe `ILoggerService` por `@Inject(LOGGER_SERVICE)`
  (DIP). Los controladores quedan sin llamadas al logger (SRP).

### Paso 2.6 — Modelo de datos (Prisma)
- `prisma/schema.prisma` — modelos `User`, `Level`, `LevelProgress`.
- `prisma/seed.ts` + script `db:seed` — siembra el nivel 1.

### Paso 2.7 — Infraestructura de BD
- `src/infrastructure/database/prisma.service.ts` — `PrismaService` (ciclo de vida;
  conexión tolerante a fallos al arrancar).
- `database.module.ts` — provee/exporta `PrismaService`.
- `prisma-level.repository.ts` — `PrismaLevelRepository implements ILevelRepository`
  (consulta `Level`, parsea `cellsJson`, devuelve `LevelDto`).

### Paso 2.8 — Adaptadores HTTP
- `src/adapters/controllers/level.controller.ts` — `LevelController`
  (`GET /levels/:id`, `ParseIntPipe` + `LevelId.of`, `@UseInterceptors(LoggingInterceptor)`,
  `NotFoundException` si no existe).
- `src/adapters/mappers/level.mapper.ts` — `LevelMapper.toResponseDto`.

### Paso 2.9 — Módulos y arranque
- `src/adapters/level.module.ts` — resuelve los tokens (`LEVEL_REPOSITORY` →
  `PrismaLevelRepository`, `LOGGER_SERVICE` → `NestLoggerAdapter`), importa
  `DatabaseModule`, declara `LevelController` y `LoggingInterceptor`.
- `src/app.module.ts` — `ConfigModule.forRoot({ isGlobal: true })` + `LevelModule`;
  conserva `AppController`/`AppService` para no romper los tests E2E.

### Paso 2.10 — Tests (AAA)
- `domain/value-objects/position.vo.spec.ts`, `direction.vo.spec.ts`.
- `domain/entities/cell.factory.spec.ts` (Factory + LSP + tipo desconocido).
- `shared/aspects/logging.interceptor.spec.ts` (2 logs en éxito; error en fallo).

### Decisiones de ingeniería del hito
1. **Generador Prisma `prisma-client-js`** (output por defecto, import
   `@prisma/client`) en lugar del generador con output custom, por robustez. Se
   ejecutó `npx prisma generate` para que el cliente compile.
2. **`import type`** para las interfaces inyectadas en constructores decorados
   (`LevelController`, `LoggingInterceptor`), requerido por `isolatedModules` +
   `emitDecoratorMetadata`.
3. **`AppController`/`AppService` conservados** para no romper los tests E2E del
   scaffold.
4. **`PrismaService` tolerante a fallos** al conectar, para que la app levante en
   desarrollo aunque PostgreSQL no esté disponible.

Verificación del hito: `npm run build` compila; **12/12** tests en verde.

---

## Estado respecto al rediseño del cliente

El rediseño del juego (rompecabezas de flechas) ocurrió **solo en el cliente
Flutter**. El backend **no se modificó** en esa etapa: permanece como base de Clean
Architecture/DDD/AOP y como hogar futuro de:

- **Autenticación JWT** (`register`/`login`) — VOs y dependencias ya listos.
- **Puntuaciones / leaderboard** — sincronización con el progreso local del cliente
  (modelo `LevelProgress`/`Score`).
- Posible **generación/validación de tableros de flechas** en servidor (etapa
  híbrida).
