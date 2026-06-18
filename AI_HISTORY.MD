# AI History — MazePruebaBack

## Entrada 001 — Phase 0: Inicialización rama main-sprint

**Fecha:** 2026-06-17
**Tarea o problema abordado:** Crear la rama `feat/main-sprint` en el repositorio backend para el Main Sprint del juego Arrow Maze. No hay cambios de código en este artefacto en la Fase 0; solo se inicializa la rama de trabajo.
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development)
**Prompt o instrucción proporcionada:** > "Execute Phase 0 of the Main Sprint plan: create feat/main-sprint branch in both repos, remove old game domain from Flutter front, replace six files with compile-only stubs, verify builds, and commit."
**Resultado obtenido:** Rama `feat/main-sprint` creada desde `main` limpio. Backend compila correctamente (`npm run build` → exit 0, `dist/` generado).
**Modificaciones realizadas por el equipo:**

## Entrada 002 — Task 2A.1: Excepciones de dominio + Value Objects

**Fecha:** 2026-06-17
**Tarea o problema abordado:** Sentar el núcleo del dominio backend (capa `domain/`, sin dependencias de framework) con la jerarquía de excepciones tipadas y los Value Objects inmutables que consumirán todas las capas superiores: `Position`, `Direction`, `CellType`, `LevelId`, `UserId`, `Email`, `HashedPassword`.
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, opus)
**Prompt o instrucción proporcionada:** > "Implementa Task 2A.1 (Domain: Excepciones + Value Objects) siguiendo TDD: escribir tests que fallan (RED), implementar excepciones y VOs, verificar verde (GREEN), commit con el mensaje exacto del plan."
**Resultado obtenido:**
- Clase base `DomainException` (extiende `Error`, restablece el prototipo para `instanceof` correcto) en `src/domain/exceptions/domain.exception.ts`.
- 8 excepciones de dominio (un archivo por excepción): `InvalidPositionException`, `InvalidLevelIdException`, `InvalidUserIdException`, `InvalidEmailException`, `InvalidHashedPasswordException`, `LevelNotFoundException`, `UserAlreadyExistsException`, `InvalidCredentialsException`.
- 7 Value Objects en `src/domain/value-objects/`: `Position` (row/col no negativos, `equals`), `LevelId`/`UserId`/`HashedPassword` (no vacíos), `Email` (regex + `equals` case-insensitive), y los enums `Direction` y `CellType`. Toda invariante se valida en el constructor lanzando la `DomainException` correspondiente.
- Tests AAA (`position.vo.spec.ts`, `level-id.vo.spec.ts`, `email.vo.spec.ts`): RED inicial por módulos inexistentes; GREEN tras implementar (15 tests nuevos, 16/16 en suite completa). `npm run build` → exit 0.
- Nota: el plan indicaba el flag `--testPathPattern`, renombrado a `--testPathPatterns` en Jest 30 (la versión del repo); se usó el flag correcto sin alterar la lógica ni los tests.
- Sin cambios en API pública (solo capa `domain/`); README.md no modificado.
**Modificaciones realizadas por el equipo:**

## Entrada 003 — Task 2A.2: Entidades de celda + CellFactory

**Fecha:** 2026-06-17
**Tarea o problema abordado:** Modelar la jerarquía de celdas del tablero en la capa `domain/` (sin dependencias de framework) y su construcción polimórfica mediante el patrón Factory Method, consumibles por infraestructura y adaptadores.
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, opus)
**Prompt o instrucción proporcionada:** > "Implementa Task 2A.2 (Domain: Entidades + CellFactory) siguiendo TDD: escribir el test que falla (RED), crear la clase base abstracta y las subclases de celda, implementar CellFactory (Factory Method), verificar verde (GREEN) y commitear con el mensaje exacto del plan."
**Resultado obtenido:**
- Clase base abstracta `ICell` (`src/domain/entities/cell.entity.ts`) con `position`, `type` y método abstracto `canBeTraversed()`.
- Cuatro subclases concretas: `ArrowCell` (con `direction` y `length`; invariante `length >= 1`, no atravesable), `EmptyCell` y `ExitCell` (atravesables), `WallCell` (no atravesable).
- `CellFactory.create(type, position, options?)` (`src/domain/entities/cell.factory.ts`): Factory Method documentado inline; centraliza la decisión de la subclase concreta por `CellType`. Exige `direction` y `length` para `ARROW`, lanzando `Error` si faltan. El `switch` cubre exhaustivamente el enum `CellType`, garantizando un retorno sin `default`.
- Tests AAA (`cell.factory.spec.ts`): RED inicial por módulo `./cell.factory` inexistente; GREEN tras implementar (5 tests nuevos, 21/21 en suite completa). `npm run build` → exit 0.
- Sin cambios en API pública (solo capa `domain/`); README.md no modificado.
**Modificaciones realizadas por el equipo:**

## Entrada 004 — Task 2A.3: Puertos de aplicación + GetLevelUseCase

**Fecha:** 2026-06-17
**Tarea o problema abordado:** Definir los puertos de la capa `application/` (repositorio de niveles y servicio de logging) e implementar el caso de uso `GetLevelUseCase`, libre de framework (sin imports de `@nestjs`), que recupera el grid de un nivel por su `LevelId`. Establece las abstracciones (DIP) que infraestructura y adaptadores implementarán/cablearán vía `useFactory`.
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, opus)
**Prompt o instrucción proporcionada:** > "Implementa Task 2A.3 (Application: Puertos + GetLevelUseCase) siguiendo TDD: escribir el test que falla (RED), crear los puertos `ILevelRepository`/`ILoggerService` con sus tokens de DI, implementar `GetLevelUseCase`, verificar verde (GREEN) y commitear con el mensaje exacto del plan."
**Resultado obtenido:**
- Puerto `ILevelRepository` (`src/application/ports/i-level.repository.ts`): `findById(id: LevelId): Promise<ICell[][] | null>` + token de inyección `LEVEL_REPOSITORY_TOKEN`.
- Puerto `ILoggerService` (`src/application/ports/i-logger.service.ts`): `log`/`error`/`warn`, abstracción AOP del logging para no acoplar el caso de uso a una implementación concreta + token `LOGGER_SERVICE_TOKEN`.
- `GetLevelUseCase` (`src/application/use-cases/get-level.use-case.ts`): recibe ambos puertos por constructor (DIP); recupera el grid y lanza `LevelNotFoundException` cuando no existe; registra el éxito a través del puerto de logging (sin `console.log`). Sin imports de `@nestjs` (caso de uso framework-free).
- Tests AAA (`get-level.use-case.spec.ts`): RED inicial por módulo `./get-level.use-case` inexistente; GREEN tras implementar (2 tests nuevos: éxito y `LevelNotFoundException`; mocks de ambos puertos para aislar la unidad). Suite completa 23/23. `tsc --noEmit` → exit 0.
- Sin cambios en API pública (capa `application/`, aún no cableada a un módulo NestJS ni a una ruta HTTP); README.md no modificado.
**Modificaciones realizadas por el equipo:**

## Entrada 005 — Task 2A.4: Infraestructura (Logger, Prisma, DatabaseModule)

**Fecha:** 2026-06-17
**Tarea o problema abordado:** Construir la capa `infrastructure/` del backend que implementa los puertos definidos en `application/`: un adaptador del logger nativo de NestJS al puerto `ILoggerService`, el `PrismaService` (cliente de base de datos con conexión en `onModuleInit`), el `DatabaseModule` que lo provee/exporta, y el modelo `Level` en el esquema Prisma. Estos artefactos serán consumidos por el futuro `LevelModule`.
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, opus)
**Prompt o instrucción proporcionada:** > "Implementa Task 2A.4 (Infrastructure: Logger, Prisma, DatabaseModule) siguiendo TDD: escribir los tests que fallan (RED), crear el NestLoggerAdapter (patrón Adapter), el PrismaService y el DatabaseModule, actualizar schema.prisma con el modelo Level, generar el cliente Prisma, verificar verde (GREEN) y commitear con el mensaje exacto del plan."
**Resultado obtenido:**
- `NestLoggerAdapter` (`src/infrastructure/logger/nest-logger.adapter.ts`): patrón Adapter documentado inline; adapta el `Logger` nativo de `@nestjs/common` al puerto `ILoggerService` de `application/`, evitando que la capa de aplicación dependa del framework. `error()` reenvía `error?.stack` al logger subyacente.
- `PrismaService` (`src/infrastructure/database/prisma.service.ts`): extiende `PrismaClient` e implementa `OnModuleInit`, conectando a la base de datos (`$connect`) al inicializar el módulo.
- `DatabaseModule` (`src/infrastructure/database/database.module.ts`): provee y exporta `PrismaService` para inyección en módulos consumidores.
- `prisma/schema.prisma`: generador cambiado a `prisma-client-js` (salida por defecto en `node_modules/@prisma/client`, acorde al import de `PrismaService`) y nuevo modelo `Level` (`id` uuid, `data` Json, `createdAt`). `npx prisma generate` → `Generated Prisma Client (v6.19.3)`, sin requerir base de datos real.
- Tests AAA: `nest-logger.adapter.spec.ts` (4 tests, espía `Logger.prototype` para verificar la delegación real de `log`/`error`/`warn`, incluido el caso sin error) y `database.module.spec.ts` (compila el módulo con `Test.createTestingModule`, sobrescribe `PrismaService` para no requerir Postgres, verifica que el proveedor se resuelve). RED inicial por módulos inexistentes; GREEN tras implementar (5 tests nuevos, 28/28 en suite completa). `npm run build` → exit 0.
- Sin cambios en API pública HTTP (capa `infrastructure/`, aún no cableada a `AppModule` ni a una ruta; el modelo Prisma no expone endpoint todavía); README.md no modificado, alineado con las entradas 002–004 de este sprint.
**Modificaciones realizadas por el equipo:**

## Entrada 007 — Task 2A.6: AOP (LoggingInterceptor)

**Fecha:** 2026-06-17
**Tarea o problema abordado:** Implementar el aspecto transversal de logging HTTP del backend como un `NestInterceptor` en `shared/aspects/`. El `LoggingInterceptor` registra el inicio de cada request (`→ MÉTODO url`) y la finalización de la respuesta (`← MÉTODO url (Nms)`) consumiendo el puerto `ILoggerService` (vía `LOGGER_SERVICE_TOKEN`), de modo que el logging no contamina la lógica de negocio (AOP). Destinado a registrarse globalmente en `AppModule`.
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, opus)
**Prompt o instrucción proporcionada:** > "Implementa Task 2A.6 (AOP: LoggingInterceptor) siguiendo TDD: escribir el test que falla (RED), crear el LoggingInterceptor que envuelve cada request/response y delega en ILoggerService, verificar verde (GREEN) y commitear con el mensaje exacto del plan."
**Resultado obtenido:**
- `LoggingInterceptor` (`src/shared/aspects/logging.interceptor.ts`): patrón AOP documentado inline; implementa `NestInterceptor`. Inyecta `ILoggerService` mediante `@Inject(LOGGER_SERVICE_TOKEN)`, manteniendo la dependencia sobre la abstracción de `application/` (DIP) y no sobre el logger concreto. En `intercept` extrae `method`/`url` de la request HTTP, registra el log de entrada, mide la duración con `Date.now()` y, mediante el operador `tap` de RxJS sobre `next.handle()`, registra el log de salida sin alterar el flujo de la respuesta. Usa `LoggingInterceptor.name` como contexto del log.
- Tests AAA (`logging.interceptor.spec.ts`): RED inicial por módulo `./logging.interceptor` inexistente; GREEN tras implementar (1 test nuevo: con un `ExecutionContext`/`CallHandler` mockeados y un `ILoggerService` mockeado, verifica que `log` se invoca dos veces y que la primera llamada contiene `→ GET /levels/1` con un contexto string). Suite completa 31/31.
- Ajuste de entorno (no de código): la versión de Jest instalada reemplazó `--testPathPattern` por `--testPathPatterns`; los tests focalizados se ejecutaron con el flag vigente. El código del interceptor se transcribió del plan sin modificaciones.
- Sin cambios en API pública HTTP (aspecto transversal en `shared/aspects/`, aún no cableado a `AppModule`); README.md no modificado, alineado con las entradas 002–006 de este sprint.
**Modificaciones realizadas por el equipo:**

## Entrada 006 — Task 2A.5: Infraestructura (PrismaLevelRepository)

**Fecha:** 2026-06-17
**Tarea o problema abordado:** Implementar el adaptador de persistencia `PrismaLevelRepository` en la capa `infrastructure/`, que cumple el puerto `ILevelRepository` de `application/` recuperando un nivel por `LevelId` vía Prisma y deserializando su grid JSON (`data`) a la jerarquía de dominio `ICell[][]` mediante `CellFactory` (Factory Method). Cierra la cadena DIP: `application/` define el contrato, `infrastructure/` lo implementa para inyección en el futuro `LevelModule`.
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, opus)
**Prompt o instrucción proporcionada:** > "Implementa Task 2A.5 (Infrastructure: PrismaLevelRepository) siguiendo TDD: escribir el test que falla (RED), crear el repositorio Prisma (patrón Adapter) que deserializa el grid JSON a `ICell[][]` con `CellFactory`, verificar verde (GREEN), build y commitear con el mensaje exacto del plan."
**Resultado obtenido:**
- `PrismaLevelRepository` (`src/infrastructure/database/prisma-level.repository.ts`): patrón Adapter documentado inline; implementa `ILevelRepository.findById`. Devuelve `null` cuando `prisma.level.findUnique` no halla el registro; en caso contrario deserializa `record.data` (JSON) a `ICell[][]` mapeando cada `RawCell` a su entidad de dominio vía `CellFactory.create(type, new Position(r, c), { direction, length })`, derivando la posición de los índices fila/columna. Interfaz interna `RawCell` para tipar la forma serializada.
- Tests AAA (`prisma-level.repository.spec.ts`): RED inicial por módulo `./prisma-level.repository` inexistente; GREEN tras implementar (2 tests nuevos: retorno `null` para nivel inexistente, y deserialización a `ArrowCell`/`EmptyCell` para nivel existente; se mockea `PrismaService` para aislar la unidad sin requerir Postgres). Suite completa 30/30.
- Ajuste mínimo sobre el código del plan: el cast `record.data as RawCell[][]` rompía `npm run build` (TS2352: el tipo `JsonValue` de Prisma no solapa con `RawCell[][]`). Se aplicó la conversión recomendada por el compilador `as unknown as RawCell[][]`, preservando intacta la lógica de deserialización. `npm run build` → exit 0.
- Sin cambios en API pública HTTP (capa `infrastructure/`, aún no cableada a `AppModule` ni a una ruta); README.md no modificado, alineado con las entradas 002–005 de este sprint.
**Modificaciones realizadas por el equipo:**

## Entrada 008 — Task 2A.7: Adapters (LevelMapper, LevelController, LevelModule) + AppModule + main.ts

**Fecha:** 2026-06-17
**Tarea o problema abordado:** Cablear la capa `adapters/` y composición del sistema completo: crear `LevelMapper` (convierte `ICell[][]` a DTO HTTP), `LevelController` (endpoint `GET /levels/:id`), `LevelModule` (DI: inyecta `PrismaLevelRepository`, `NestLoggerAdapter` y `GetLevelUseCase` via `useFactory`), actualizar `AppModule` con `ConfigModule` global y `LoggingInterceptor` como `APP_INTERCEPTOR`, y actualizar `main.ts` con `ValidationPipe`. Se eliminaron los archivos de scaffold (`app.controller.ts`, `app.service.ts`, `app.controller.spec.ts`).
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, sonnet)
**Prompt o instrucción proporcionada:** > "Implementa Task 2A.7 (Adapters: Mapper + Controller + Modules): crear LevelMapper, LevelController, LevelModule, actualizar AppModule con LoggingInterceptor global, actualizar main.ts con ValidationPipe, eliminar scaffold. Compilar, correr suite completa y commitear con el mensaje exacto del plan."
**Resultado obtenido:**
- `LevelMapper` (`src/adapters/mappers/level.mapper.ts`): convierte `ICell[][]` a `LevelResponseDto`; usa `instanceof ArrowCell` para incluir `direction` y `length` solo en celdas de tipo ARROW. Expone interfaces `CellDto` y `LevelResponseDto`.
- `LevelController` (`src/adapters/controllers/level.controller.ts`): `@Controller('levels')`, `@Get(':id')`; construye `LevelId` desde el parámetro de ruta y delega en `GetLevelUseCase`, mapea el resultado via `LevelMapper.toDto`.
- `LevelModule` (`src/adapters/level.module.ts`): wires `PrismaLevelRepository` (token `LEVEL_REPOSITORY_TOKEN`), `NestLoggerAdapter` (token `LOGGER_SERVICE_TOKEN`) y `GetLevelUseCase` via `useFactory` manteniendo la regla de que el use case es framework-free (instanciado con `new`).
- `AppModule` (`src/app.module.ts`): importa `ConfigModule.forRoot({ isGlobal: true })` y `LevelModule`; provee `LOGGER_SERVICE_TOKEN` y registra `LoggingInterceptor` como `APP_INTERCEPTOR` global.
- `main.ts`: añade `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` como global pipe.
- `npm run build` → exit 0, sin errores TypeScript.
- Suite completa: 30/30 tests pasan. El plan no especificó specs nuevos para esta capa (adapter); las clases son DTOs y wiring NestJS sin lógica de dominio.
- API pública introducida: `GET /levels/:id`; README.md actualizado con sección de arquitectura y tabla de endpoints.
**Modificaciones realizadas por el equipo:**
