# Arrow Maze — Backend (NestJS)

API REST de **Arrow Maze**. Implementa Clean Architecture, principios SOLID,
patrones GoF, DDD (Value Objects) y AOP (interceptor de logging) sobre NestJS +
Prisma + PostgreSQL.

Este documento describe la arquitectura, la estructura, **cómo funciona cada
parte del código** y cómo ejecutarlo, para entender y corregir el backend lo más
rápido posible.

> **Estado actual / alcance.** El juego (rompecabezas de flechas) corre hoy en el
> cliente Flutter. El backend está construido como base **escalable y testeada**:
> expone el endpoint de niveles `GET /levels/:id` y deja lista la infraestructura
> (VOs de auth, modelo de datos, AOP) para las siguientes etapas
> (autenticación JWT y sincronización de puntuaciones). Las entidades de celda del
> dominio corresponden al modelado original de nivel y conviven como ejemplo de
> Factory Method / OCP-LSP (ver [deuda conocida](#deuda-conocida)).

---

## Índice

1. [Stack técnico](#stack-técnico)
2. [Arquitectura (Clean + DDD)](#arquitectura-clean--ddd)
3. [Estructura de carpetas](#estructura-de-carpetas)
4. [Capa de Dominio](#capa-de-dominio)
5. [Capa de Aplicación (puertos)](#capa-de-aplicación-puertos)
6. [AOP — Interceptor de Logging](#aop--interceptor-de-logging)
7. [Capa de Infraestructura (Prisma)](#capa-de-infraestructura-prisma)
8. [Capa de Adaptadores (HTTP)](#capa-de-adaptadores-http)
9. [Módulos y arranque (DI)](#módulos-y-arranque-di)
10. [Modelo de datos (Prisma)](#modelo-de-datos-prisma)
11. [Flujo de una petición](#flujo-de-una-petición)
12. [Patrones de diseño aplicados](#patrones-de-diseño-aplicados)
13. [Pruebas](#pruebas)
14. [Puesta en marcha](#puesta-en-marcha)
15. [Comandos de desarrollo](#comandos-de-desarrollo)
16. [Variables de entorno](#variables-de-entorno)
17. [Deuda conocida](#deuda-conocida)

---

## Stack técnico

| Área | Tecnología |
|------|-----------|
| Framework | NestJS 11 (TypeScript) |
| ORM / BD | Prisma 6 + PostgreSQL |
| Auth (preparado) | `@nestjs/jwt`, `passport-jwt`, `bcryptjs` |
| Config | `@nestjs/config` |
| Validación | `class-validator`, `class-transformer` |
| Pruebas | Jest |

---

## Arquitectura (Clean + DDD)

Cuatro capas con la **regla de dependencia** hacia adentro:

```
Adapters (HTTP) ──▶ Application (puertos) ──▶ Domain
Infrastructure ────▶ Application (implementa puertos)
Infrastructure ────▶ Domain (usa VOs/entidades)
Shared (AOP) ──────▶ transversal
```

Reglas que se cumplen en el código:

- `domain/` es **TypeScript puro**: sin imports de NestJS ni Prisma.
- `application/ports/` define **interfaces** (contratos). La aplicación depende de
  ellas, nunca de implementaciones.
- La inversión de dependencias (DIP) se resuelve con **tokens de inyección**
  (`Symbol`) en el módulo, ya que las interfaces de TS no existen en runtime.

**DDD:** el dominio usa **Value Objects** inmutables (constructor privado +
factory `of()`/`fromHash()`) que validan sus invariantes; se evita la
*primitive obsession* con `string`/`number`.

---

## Estructura de carpetas

```
src/
├── main.ts                          ← bootstrap NestJS
├── app.module.ts                    ← módulo raíz (ConfigModule + LevelModule)
├── app.controller.ts / app.service.ts  ← "GET /" de salud (boilerplate conservado)
│
├── domain/                          ← CAPA 1 — puro, sin framework
│   ├── value-objects/
│   │   ├── position.vo.ts           ← Position (of, equals, no-negativo)
│   │   ├── direction.vo.ts          ← Direction (enum + rotateClockwise)
│   │   ├── cell-type.vo.ts          ← CellType (ARROW/WALL/EMPTY/EXIT)
│   │   ├── level-id.vo.ts           ← LevelId (entero positivo)
│   │   ├── user-id.vo.ts            ← UserId (UUID validado)
│   │   ├── email.vo.ts              ← Email (regex)
│   │   └── hashed-password.vo.ts    ← HashedPassword (solo desde hash; toString redacta)
│   ├── entities/
│   │   ├── cell.entity.ts           ← ICell abstracta (OCP/LSP)
│   │   ├── arrow-cell.entity.ts     ← ArrowCell (rotate inmutable)
│   │   ├── wall-cell.entity.ts      ← WallCell (no transitable)
│   │   ├── empty-cell.entity.ts     ← EmptyCell
│   │   ├── exit-cell.entity.ts      ← ExitCell
│   │   └── cell.factory.ts          ← Factory Method
│   └── exceptions/                  ← DomainException + específicas
│
├── application/
│   └── ports/
│       ├── i-logger.service.ts      ← ILoggerService + token LOGGER_SERVICE
│       └── i-level.repository.ts    ← ILevelRepository + token LEVEL_REPOSITORY + LevelDto
│
├── infrastructure/                  ← CAPA 4 — detalles técnicos
│   ├── logger/nest-logger.adapter.ts        ← Adapter del Logger de Nest
│   └── database/
│       ├── prisma.service.ts        ← PrismaClient + ciclo de vida (conexión tolerante)
│       ├── database.module.ts       ← provee/exporta PrismaService
│       └── prisma-level.repository.ts ← ILevelRepository sobre Prisma
│
├── adapters/                        ← CAPA 3 — puente HTTP ↔ dominio
│   ├── controllers/level.controller.ts ← GET /levels/:id
│   ├── mappers/level.mapper.ts      ← LevelDto → DTO de respuesta HTTP
│   └── level.module.ts              ← resuelve tokens (DIP) → implementaciones
│
└── shared/aspects/logging.interceptor.ts ← AOP: log de entrada/salida/duración

prisma/
├── schema.prisma                    ← modelos User, Level, LevelProgress
└── seed.ts                          ← siembra el nivel 1 (npm run db:seed)
```

---

## Capa de Dominio

### Value Objects (`domain/value-objects/`)

Inmutables, comparados por valor (`equals`). Construcción controlada con factory
estático que **valida invariantes** y lanza una excepción de dominio.

| VO | Invariante / nota |
|----|-------------------|
| `Position.of(x,y)` | enteros **no negativos** (`InvalidPositionException`). |
| `Direction.of(raw)` | valor del enum; `rotateClockwise()` devuelve una **nueva** dirección. |
| `CellType.of(raw)` | `ARROW/WALL/EMPTY/EXIT` (`UnknownCellTypeException`). |
| `LevelId.of(n)` | entero positivo (`RangeError`). |
| `UserId.of(raw)` | formato UUID (`InvalidUuidException`). |
| `Email.of(raw)` | regex de email (`InvalidEmailException`). |
| `HashedPassword.fromHash(hash)` | **solo** se crea desde un hash; **no** existe factory de texto plano (el hasheo es responsabilidad de infraestructura). `toString()` devuelve `[REDACTED]` para no filtrar el hash en logs. |

### Entidades de celda + Factory Method (`domain/entities/`)

- `ICell` es una **clase abstracta** con `position: Position`, `cellType: CellType`
  y el método abstracto `isPassable()`.
  - **OCP** (Open/Closed): el código cliente depende de `ICell`; añadir un tipo
    nuevo = nueva subclase, sin tocar las existentes.
  - **LSP** (Liskov): toda subclase es sustituible donde se espere `ICell`.
- `ArrowCell` (transitable, `rotate()` devuelve una nueva instancia inmutable),
  `WallCell` (no transitable), `EmptyCell`, `ExitCell`.
- `CellFactory.create(type, position, direction?)` → **Factory Method**: el cliente
  nunca instancia clases concretas; pide una celda a partir de sus Value Objects.

### Excepciones (`domain/exceptions/`)

`DomainException` (base, sin NestJS) + específicas. La traducción a códigos HTTP es
responsabilidad de las capas externas, no del dominio.

---

## Capa de Aplicación (puertos)

`application/ports/` define los **contratos** que la infraestructura implementa:

- `ILoggerService` (`log`/`warn`/`error`) + token `LOGGER_SERVICE`.
- `ILevelRepository` (`findById(id: LevelId): Promise<LevelDto | null>`) + token
  `LEVEL_REPOSITORY`. `LevelDto` es una forma **plana** (sin entidades de dominio)
  que cruza el límite con la infraestructura.

Los **tokens** (`Symbol`) son necesarios porque en NestJS las interfaces no existen
en tiempo de ejecución; el provider se registra bajo el token y se inyecta con
`@Inject(TOKEN)`.

---

## AOP — Interceptor de Logging

`shared/aspects/logging.interceptor.ts` (`LoggingInterceptor`):

- Registra `[IN] Clase.método`, luego `[OUT] … (+Xms)` al completar, o `[ERROR]` si
  la ejecución falla (vía `tap`/`catchError` de RxJS).
- Recibe `ILoggerService` por **inyección** (`@Inject(LOGGER_SERVICE)`) — **DIP**:
  no depende de Winston/Pino ni del `Logger` de Nest directamente.
- **SRP:** su única responsabilidad es el logging. La lógica de negocio
  (controladores) queda **sin una sola llamada al logger**.

Estrategia SOLID (resumen para documentación): el aspecto está completamente
aislado del negocio; cambiar el backend de logs no afecta a controladores ni casos
de uso.

---

## Capa de Infraestructura (Prisma)

- **`PrismaService`** extiende `PrismaClient` e implementa `OnModuleInit`/
  `OnModuleDestroy`. La conexión inicial es **tolerante a fallos**: si la BD no está
  disponible al arrancar, registra una advertencia y reintenta de forma perezosa
  (útil en desarrollo; la app igual levanta).
- **`DatabaseModule`** provee y exporta `PrismaService`.
- **`PrismaLevelRepository`** implementa `ILevelRepository`: consulta la tabla
  `Level`, parsea la columna `cellsJson` (`{ playerStart, cells }`) y devuelve un
  `LevelDto`. **Todo el detalle de Prisma vive aquí**; el puerto nunca expone tipos
  del ORM hacia adentro.

---

## Capa de Adaptadores (HTTP)

- **`LevelController`** (`@Controller('levels')`):
  - `GET /levels/:id` → convierte el `:id` con `ParseIntPipe` y `LevelId.of(id)`,
    consulta el repositorio (por token), y si no existe lanza `NotFoundException`.
  - Aplica `@UseInterceptors(LoggingInterceptor)`. **Sin lógica de negocio** (SRP).
- **`LevelMapper.toResponseDto(LevelDto)`** separa el contrato HTTP de la
  representación interna.

---

## Módulos y arranque (DI)

- **`LevelModule`** es el único lugar donde los **tokens** se resuelven a
  implementaciones concretas:
  - `{ provide: LEVEL_REPOSITORY, useClass: PrismaLevelRepository }`
  - `{ provide: LOGGER_SERVICE, useClass: NestLoggerAdapter }`
  - importa `DatabaseModule`, declara `LevelController` y `LoggingInterceptor`.
- **`AppModule`** importa `ConfigModule.forRoot({ isGlobal: true })` y `LevelModule`.
  Conserva `AppController`/`AppService` (`GET /`) para no romper los tests E2E del
  scaffold.
- **`main.ts`** hace el `bootstrap` y escucha en `process.env.PORT ?? 3000`.

---

## Modelo de datos (Prisma)

`prisma/schema.prisma` (generador `prisma-client-js`, datasource PostgreSQL):

- **`User`** `{ id (uuid), email (unique), passwordHash, createdAt, progress[] }`.
- **`Level`** `{ id, width, height, cellsJson (String), progress[] }` —
  `cellsJson` guarda `{ playerStart: {x,y}, cells: [{x,y,type,direction?}] }`.
- **`LevelProgress`** `{ id, userId→User, levelId→Level, isCompleted,
  bestMoveCount, updatedAt }` con `@@unique([userId, levelId])`.

`prisma/seed.ts` siembra el nivel 1 (mismo layout que el asset del cliente) y se
ejecuta con `npm run db:seed`.

---

## Flujo de una petición

```
GET /levels/1
  → LoggingInterceptor  ([IN] LevelController.getById)
  → LevelController.getById(ParseIntPipe → LevelId.of(1))
  → ILevelRepository (PrismaLevelRepository).findById(LevelId)
      → PrismaService.level.findUnique({ where: { id: 1 } })
      → JSON.parse(cellsJson) → LevelDto
  → LevelMapper.toResponseDto(LevelDto)
  → 200 JSON   (LoggingInterceptor: [OUT] … +Xms)
  (si no existe el nivel → 404 NotFoundException)
```

---

## Patrones de diseño aplicados

| Patrón | Dónde | Para qué |
|--------|-------|----------|
| **Value Object (DDD)** | `domain/value-objects/` | Invariantes encapsulados; sin *primitive obsession*. |
| **Factory Method** | `cell.factory.ts` | Crear celdas sin instanciar clases concretas (OCP). |
| **Adapter** | `NestLoggerAdapter` | Envuelve el `Logger` de Nest tras `ILoggerService`. |
| **Repository / Port (DIP)** | `ILevelRepository` + `PrismaLevelRepository` | Desacopla la app de Prisma. |
| **Interceptor / AOP** | `LoggingInterceptor` | Logging transversal fuera del negocio. |
| **Module / IoC** | `LevelModule`, `DatabaseModule` | Composición e inyección por tokens. |

---

## Pruebas

Jest, patrón **AAA**. Tests unitarios **no requieren base de datos**:

| Archivo | Qué valida |
|---------|------------|
| `domain/value-objects/position.vo.spec.ts` | Igualdad por valor + rechazo de coordenadas inválidas. |
| `domain/value-objects/direction.vo.spec.ts` | Ciclo de `rotateClockwise` + parseo. |
| `domain/entities/cell.factory.spec.ts` | Factory crea el tipo correcto; LSP vía `isPassable()`; tipo desconocido lanza excepción. |
| `shared/aspects/logging.interceptor.spec.ts` | Llama al logger 2 veces (IN+OUT) y registra el error en fallos. |
| `app.controller.spec.ts` + `test/app.e2e-spec.ts` | Salud `GET /`. |

Estado actual: **12/12** en verde; `npm run build` compila.

---

## Puesta en marcha

```bash
npm install
npx prisma generate          # genera el cliente Prisma (necesario para compilar)

# Para que GET /levels/:id devuelva datos (requiere PostgreSQL en marcha):
npx prisma migrate dev --name init
npm run db:seed              # siembra el nivel 1

npm run start:dev            # API en http://localhost:3000
```

> El servidor **arranca aunque la BD no esté disponible** (conexión perezosa); en
> ese caso `GET /levels/:id` fallará al consultar. Los tests unitarios corren sin BD.

---

## Comandos de desarrollo

```bash
npm run start:dev    # desarrollo con hot-reload
npm run build        # compilar (nest build / tsc)
npm test             # tests unitarios (Jest)
npm run test:cov     # cobertura
npm run test:e2e     # tests E2E
npm run db:seed      # sembrar nivel 1 (requiere BD + migración)
npx prisma studio    # explorador visual de la BD
```

---

## Variables de entorno

`.env` (no subir a git):

```
DATABASE_URL="postgresql://usuario:password@localhost:5432/arrow_maze?schema=public"
JWT_SECRET="..."
JWT_EXPIRATION="7d"
PORT=3000
```

---

## Deuda conocida

- **Entidades de celda vs. nuevo juego:** la jerarquía `ICell`/`CellFactory` y el
  endpoint de niveles modelan el concepto original de nivel. El juego actual
  (rompecabezas de flechas) se generó en el cliente. Cuando se aborde la etapa
  híbrida, el backend puede pasar a **generar/validar tableros de flechas** y/o
  almacenar **puntuaciones** (`Score`/`LevelProgress`).
- **Auth JWT pendiente:** los VOs (`Email`, `HashedPassword`, `UserId`) y las
  dependencias (`@nestjs/jwt`, `bcryptjs`) están listos para `register`/`login`.
- **Endpoints de scores/leaderboard pendientes** para la sincronización con el
  progreso local del cliente.
