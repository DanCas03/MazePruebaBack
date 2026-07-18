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

## Entrada 007 — Task 2A.6: AOP (LoggingInterceptor)

**Fecha:** 2026-06-17
**Tarea o problema abordado:** Implementar el aspecto transversal de logging HTTP del backend como un `NestInterceptor` en `shared/aspects/`. El `LoggingInterceptor` registra el inicio de cada request (`→ MÉTODO url`) y la finalización de la respuesta (`← MÉTODO url (Nms)`) consumiendo el puerto `ILoggerService` (vía `LOGGER_SERVICE_TOKEN`), de modo que el logging no contamina la lógica de negocio (AOP). Destinado a registrarse globalmente en `AppModule`.
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, opus)
**Prompt o instrucción proporcionada:** > "Implementa Task 2A.6 (AOP: LoggingInterceptor) siguiendo TDD: escribir el test que falla (RED), crear the LoggingInterceptor que envuelve cada request/response y delega en ILoggerService, verificar verde (GREEN) y commitear con el mensaje exacto del plan."
**Resultado obtenido:**
- `LoggingInterceptor` (`src/shared/aspects/logging.interceptor.ts`): patrón AOP documentado inline; implementa `NestInterceptor`. Inyecta `ILoggerService` mediante `@Inject(LOGGER_SERVICE_TOKEN)`, manteniendo la dependencia sobre la abstracción de `application/` (DIP) y no sobre el logger concreto. En `intercept` extrae `method`/`url` de la request HTTP, registra el log de entrada, mide la duración con `Date.now()` y, mediante el operador `tap` de RxJS sobre `next.handle()`, registra el log de salida sin alterar el flujo de la respuesta. Usa `LoggingInterceptor.name` como contexto del log.
- Tests AAA (`logging.interceptor.spec.ts`): RED inicial por módulo `./logging.interceptor` inexistente; GREEN tras implementar (1 test nuevo: con un `ExecutionContext`/`CallHandler` mockeados y un `ILoggerService` mockeado, verifica que `log` se invoca dos veces y que la primera llamada contiene `→ GET /levels/1` con un contexto string). Suite completa 31/31.
- Ajuste de entorno (no de código): la versión de Jest instalada reemplazó `--testPathPattern` por `--testPathPatterns`; los tests focalizados se ejecutaron con el flag vigente. El código del interceptor se transcribió del plan sin modificaciones.
- Sin cambios en API pública HTTP (aspecto transversal en `shared/aspects/`, aún no cableada a `AppModule`); README.md no modificado, alineado con las entradas 002–006 de este sprint.
**Modificaciones realizadas por el equipo:**

## Entrada 008 — Task 2A.7: Adapters (LevelMapper, LevelController, LevelModule) + AppModule + main.ts

**Fecha:** 2026-06-17
**Tarea o problema abordado:** Cablear la capa `adapters/` y composición del sistema completo: crear `LevelMapper` (convierte `ICell[][]` a DTO HTTP), `LevelController` (endpoint `GET /levels/:id`), `LevelModule` (DI: inyecta `PrismaLevelRepository`, `NestLoggerAdapter` y `GetLevelUseCase` via `useFactory`), actualizar `AppModule` con `ConfigModule` global y `LoggingInterceptor` como `APP_INTERCEPTOR`, y actualizar `main.ts` con `ValidationPipe`. Se eliminaron los archivos de scaffold (`app.controller.ts`, `app.service.ts`, `app.controller.spec.ts`).
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, sonnet)
**Prompt o instrucción proporcionada:** > "Implementa Task 2A.7 (Adapters: Mapper + Controller + Modules): crear LevelMapper, LevelController, LevelModule, actualizar AppModule con LoggingInterceptor global, actualizar main.ts con ValidationPipe, eliminar scaffold. Compilar, correr suite completa y commitear con el mensaje exacto del plan."
**Resultado obtenido:**
- `LevelMapper` (`src/adapters/mappers/level.mapper.ts`): convierte `ICell[][]` a `LevelResponseDto`; usa `instanceof ArrowCell` para incluir `direction` y `length` solo en celdas de tipo ARROW. Expone interfaces `CellDto` y `LevelResponseDto`.
- `LevelController` (`src/adapters/controllers/level.controller.ts`): `@Controller('levels')`, `@Get(':id')`; construye `LevelId` desde el parámetro de ruta y delega en `GetLevelUseCase`, mapea el resultado via `LevelMapper.toDto`.
- `LevelModule` (`src/adapters/level.module.ts`): wires `PrismaLevelRepository` (token `LEVEL_REPOSITORY_TOKEN`), `NestLoggerAdapter` (token `LOGGER_SERVICE_TOKEN`) y `GetLevelUseCase` via `useFactory` manteniendo la regla de que the use case es framework-free (instanciado con `new`).
- `AppModule` (`src/app.module.ts`): importa `ConfigModule.forRoot({ isGlobal: true })` y `LevelModule`; provee `LOGGER_SERVICE_TOKEN` y registra `LoggingInterceptor` como `APP_INTERCEPTOR` global.
- `main.ts`: añade `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` como global pipe.
- `npm run build` → exit 0, sin errores TypeScript.
- Suite completa: 30/30 tests pasan. El plan no especificó specs nuevos para esta capa (adapter); las clases son DTOs y wiring NestJS sin lógica de dominio.
- API pública introducida: `GET /levels/:id`; README.md actualizado con sección de arquitectura y tabla de endpoints.
**Modificaciones realizadas por el equipo:**

## Entrada 009 — Task 2A.7: Fix de hallazgos de revisión (404, test de controller, DRY/OCP)

**Fecha:** 2026-06-17
**Tarea o problema abordado:** Corregir hallazgos de revisión sobre Task 2A.7 ya commiteada. (1) Una `LevelNotFoundException` no capturada producía HTTP 500 en lugar de 404; (2) faltaba el spec del `LevelController` (mandato CLAUDE.md); (3) duplicación del binding `LOGGER_SERVICE_TOKEN`/`NestLoggerAdapter` en `LevelModule` y `AppModule` (dos instancias) y uso de `instanceof` en `LevelMapper` en lugar del discriminante `ICell.type`.
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, opus)
**Prompt o instrucción proporcionada:** > "FIXING review findings on the ALREADY-COMMITTED Task 2A.7: map not-found a 404 (preferentemente un filtro de excepciones de dominio reutilizable), añadir level.controller.spec.ts (AAA, use case mockeado), y opcionalmente DRY del logger y OCP en el mapper. Amend (nuevo commit), correr npm test."
**Resultado obtenido:**
- `DomainExceptionFilter` (`src/shared/aspects/domain-exception.filter.ts`): filtro AOP global (`@Catch(DomainException)`) que traduce excepciones de dominio a HTTP. Registro `Map<constructor, HttpStatus>` con `LevelNotFoundException -> 404`; default `400` para subtipos no mapeados (nunca 500). Extensible para las excepciones de auth de la Fase 3 (OCP: se añaden entradas al registro sin tocar el `catch`). Registrado como `APP_FILTER` en `AppModule`.
- `level.controller.spec.ts`: AAA con `GetLevelUseCase` mockeado. (a) delega construyendo un `LevelId` desde el `:id` y devuelve el DTO mapeado; (b) propaga `LevelNotFoundException` cuando el use case lanza (el filtro global lo convierte en 404). Sin DB.
- `domain-exception.filter.spec.ts`: AAA verificando el mapeo real 404 y the default 400.
- DRY: nuevo `LoggerModule` (`src/infrastructure/logger/logger.module.ts`, `@Global`) centraliza el binding `LOGGER_SERVICE_TOKEN -> NestLoggerAdapter` y lo exporta; eliminada la doble declaración en `LevelModule` y `AppModule` (una sola instancia del adapter).
- OCP: `LevelMapper` discrimina por `cell.type === CellType.ARROW` en vez de `instanceof ArrowCell`, desacoplando el mapper de la jerarquía concreta.
- `npm run build` → exit 0; `npm test` → 11 suites, 34/34 tests pasan (antes 30).
- API pública: README.md actualizado con la forma de respuesta de error 404 y la mención del `DomainExceptionFilter` en la arquitectura.
**Modificaciones realizadas por el equipo:**

## Entrada 010 — Task 3.1: HashedPassword VO (equals) + spec + User entity

**Fecha:** 2026-06-18
**Tarea o problema abordado:** Completar el Value Object `HashedPassword` con el método `equals`, añadir su test AAA completo (`hashed-password.vo.spec.ts`) y crear la entidad de dominio pura `User` (id, email, password). El VO ya existía de la Task 2A.1 con la validación de vacío/whitespace; este fragmento añade el método que faltaba y cubre los 5 casos de test del spec del plan.
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, sonnet)
**Prompt o instrucción proporcionada:** > "Implementa Task 3.1 (Domain: HashedPassword VO + User entity): el VO ya existe, añadir equals, crear spec AAA (5 tests: creación, empty, whitespace, equals true/false) y crear user.entity.ts (id: UserId, email: Email, password: HashedPassword). TDD, build y commit."
**Resultado obtenido:**
- `HashedPassword.equals(other)` añadido a `src/domain/value-objects/hashed-password.vo.ts`; la validación de vacío/whitespace ya existía (`value.trim() === ''`), no se modificó.
- `src/domain/value-objects/hashed-password.vo.spec.ts`: 5 tests AAA (creación válida, `InvalidHashedPasswordException` para `""` y `"   "`, `equals` true, `equals` false). GREEN inmediato (el VO existente ya cubría whitespace-only).
- `src/domain/entities/user.entity.ts`: entidad pura, contenedor de tres VOs, sin lógica propia ni imports de framework.
- `npm test` → 39/39 tests pasan (12 suites). `npm run build` → exit 0.
- Sin cambios en API pública HTTP; README.md no modificado.
**Modificaciones realizadas por el equipo:**

## Entrada 011 — Task 3.2: Puertos de Auth + RegisterUseCase + LoginUseCase

**Fecha:** 2026-06-18
**Tarea o problema abordado:** Definir los tres puertos de la capa `application/` para el flujo de autenticación (`IUserRepository`, `IHashService`, `ITokenService`) con sus tokens de DI, e implementar los casos de uso `RegisterUseCase` y `LoginUseCase` como TypeScript puro (cero imports `@nestjs`), orquestando los puertos vía constructor (DIP). Completa el slice vertical de aplicación para auth, listo para que la capa `infrastructure/` provea las implementaciones concretas.
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, sonnet)
**Prompt o instrucción proporcionada:** > "Implementa Task 3.2 (Application: Puertos de Auth + RegisterUseCase + LoginUseCase): crear los 3 puertos con tokens en application/ports/, escribir tests AAA que fallan (RED: 5 casos), implementar los use cases mínimos para verde (GREEN), npm run build exit 0, commit por fragmento."
**Resultado obtenido:**
- `src/application/ports/i-user.repository.ts`: interfaz `IUserRepository` con `findByEmail(email: Email): Promise<User | null>` y `save(user: User): Promise<void>` + token `USER_REPOSITORY_TOKEN`. Sin imports de `@nestjs`.
- `src/application/ports/i-hash.service.ts`: interfaz `IHashService` con `hash(plain: string): Promise<string>` y `compare(plain: string, hashed: string): Promise<boolean>` + token `HASH_SERVICE_TOKEN`.
- `src/application/ports/i-token.service.ts`: interfaz `ITokenService` con `sign(payload: { sub: string; email: string }): string` + token `TOKEN_SERVICE_TOKEN`.
- `src/application/use-cases/register.use-case.ts`: `RegisterUseCase` (Command pattern documentado inline, DIP). Flujo: valida `Email` VO, comprueba duplicado lanzando `UserAlreadyExistsException`, hashea contraseña, construye `User` con UUID aleatorio, guarda y devuelve token. Cero imports de `@nestjs`.
- `src/application/use-cases/login.use-case.ts`: `LoginUseCase` (Command pattern documentado inline, DIP). Flujo: busca usuario, lanza `InvalidCredentialsException` si no existe, compara hash y lanza misma excepción si falla, devuelve token. Cero imports de `@nestjs`.
- Tests AAA (`register.use-case.spec.ts`, `login.use-case.spec.ts`): RED inicial (Cannot find module); GREEN tras implementar (5 tests nuevos: register ok, email duplicado, login ok, usuario inexistente, password incorrecta). Suite completa: 44/44. `npm run build` → exit 0.
- Sin cambios en API pública HTTP (capa `application/`, aún no cableada a un módulo NestJS ni a una ruta); README.md no modificado.
**Modificaciones realizadas por el equipo:**

## Entrada 012 — Task 3.3: BcryptHashService + JwtTokenService + PrismaUserRepository + User model

**Fecha:** 2026-06-18
**Tarea o problema abordado:** Implementar los tres adaptadores de infraestructura para el flujo de autenticación: `BcryptHashService` (puerto `IHashService` usando `bcryptjs`), `JwtTokenService` (puerto `ITokenService` usando `@nestjs/jwt`), y `PrismaUserRepository` (puerto `IUserRepository` usando Prisma). Añadir el modelo `User` a `prisma/schema.prisma` y regenerar el cliente Prisma. Ninguno de estos adaptadores requiere base de datos real — los tests mockean `PrismaService` y `JwtService`.
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, sonnet)
**Prompt o instrucción proporcionada:** > "Implementa Task 3.3 (Infrastructure: BcryptHashService + JwtTokenService + PrismaUserRepository): añade modelo User a schema.prisma, ejecuta npx prisma generate, crea los tres adapters en infrastructure/security/ e infrastructure/database/, TDD con tests AAA que mockean dependencias externas, npm test verde y npm run build exit 0, commit por fragmento."
**Resultado obtenido:**
- `prisma/schema.prisma`: modelo `User` añadido (`id` uuid, `email` unique, `password`, `createdAt`). `npx prisma generate` → cliente regenerado (v6.19.3) sin requerir DB.
- `src/infrastructure/security/bcrypt-hash.service.ts`: patrón Adapter documentado inline; implementa `IHashService` delegando en `bcryptjs` con `saltRounds = 10`. Cero dependencias de `@nestjs` salvo el decorador `@Injectable`.
- `src/infrastructure/security/jwt-token.service.ts`: patrón Adapter documentado inline; implementa `ITokenService` delegando en `JwtService` de `@nestjs/jwt`. Constructor recibe `JwtService` por inyección (DIP).
- `src/infrastructure/database/prisma-user.repository.ts`: patrón Adapter documentado inline; implementa `IUserRepository` con `findByEmail` (consulta por email, mapea record → entidad `User`) y `save` (inserta con `prisma.user.create`). Mapeo explícito entre record de persistencia y Value Objects de dominio.
- Tests AAA (3 nuevas suites): `bcrypt-hash.service.spec.ts` (3 tests: hash distinto del plain, compare true, compare false — usa bcrypt real), `jwt-token.service.spec.ts` (1 test: delega en `JwtService.sign` mockeado), `prisma-user.repository.spec.ts` (3 tests: findByEmail null, findByEmail retorna User entity, save llama a prisma.user.create con datos correctos — `PrismaService` mockeado). RED → GREEN.
- `npm test` → 17 suites, 51/51 tests pasan. `npm run build` → exit 0.
- Sin cambios en API pública HTTP (capa `infrastructure/`, aún no cableada a un módulo NestJS de auth); README.md no modificado.
**Modificaciones realizadas por el equipo:**

## Entrada 013 — Task 3.4: JwtStrategy + JwtAuthGuard

**Fecha:** 2026-06-18
**Tarea o problema abordado:** Implementar la estrategia JWT de Passport (`JwtStrategy`) y el guardia de autenticación (`JwtAuthGuard`) en la capa `infrastructure/security/`. `JwtStrategy` extiende `PassportStrategy(Strategy)` y lee `JWT_SECRET` vía `ConfigService` (DIP — nunca `process.env` directo); su método `validate` extrae `{ userId, email }` del payload. `JwtAuthGuard` extiende `AuthGuard('jwt')` como guardia reutilizable para proteger rutas. Ambas clases existen y compilan; no se usan para proteger `/auth/*` (register/login son públicos) pero están listas para decorar cualquier ruta futura.
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, sonnet)
**Prompt o instrucción proporcionada:** > "Implementa Task 3.4 (Infrastructure: JwtStrategy + JwtAuthGuard): TDD AAA, JwtStrategy lee JWT_SECRET via ConfigService, JwtAuthGuard extiende AuthGuard('jwt'), tests RED→GREEN, npm test 56 verde, npm run build exit 0, commit por fragmento."
**Resultado obtenido:**
- `src/infrastructure/security/jwt.strategy.ts`: patrón Adapter documentado inline; extiende `PassportStrategy(Strategy)` con extracción de token del header `Authorization: Bearer`, sin ignorar expiración y con `secretOrKey` leído de `ConfigService.getOrThrow('JWT_SECRET')`. `validate(payload)` mapea `sub → userId` y retorna `{ userId, email }`.
- `src/infrastructure/security/jwt-auth.guard.ts`: extiende `AuthGuard('jwt')` (patrón OCP documentado inline). Clase minimal, la lógica de validación queda en `JwtStrategy`.
- Tests AAA: `jwt.strategy.spec.ts` (3 tests: `ConfigService.getOrThrow` llamado con `'JWT_SECRET'`, `validate` con payload A, `validate` con payload B — `ConfigService` mockeado para aislar de env vars), `jwt-auth.guard.spec.ts` (2 tests: instanceof `AuthGuard('jwt')`, instanciable). RED inicial por módulos inexistentes; GREEN tras implementar.
- `npm test` → 19 suites, 56/56 tests pasan. `npm run build` → exit 0.
- Sin cambios en API pública HTTP (ningún endpoint protegido por el guard todavía); README.md no modificado.
**Modificaciones realizadas por el equipo:**

## Entrada 014 — Task 3.5: DTOs + AuthController + AuthModule + AppModule

**Fecha:** 2026-06-18
**Tarea o problema abordado:** Implementar la capa de adaptadores HTTP para autenticación: `RegisterDto` y `LoginDto` con class-validator, `AuthController` (POST /auth/register -> 201 {token}; POST /auth/login -> 200 {token}), `AuthModule` con `useFactory` para cablear los use cases de forma framework-free (DIP, imitando patrón de LevelModule), y registro de `AuthModule` en `AppModule`. Extender `DomainExceptionFilter` para mapear `InvalidCredentialsException` a HTTP 401 (OCP).
**Herramienta de IA utilizada:** Claude Code (subagent-driven-development, sonnet)
**Prompt o instrucción proporcionada:** > "Implementa Task 3.5 (Adapters: DTOs + AuthController + AuthModule): TDD AAA, DTOs con class-validator, AuthController invoca solo use cases, AuthModule usa useFactory para wiring, registra AuthModule en AppModule, extiende DomainExceptionFilter para 401, npm test todo verde, npm run build exit 0, commit por fragmento."
**Resultado obtenido:**
- `src/adapters/dtos/register.dto.ts`: `RegisterDto` con `@IsEmail()` y `@MinLength(8)` en password.
- `src/adapters/dtos/login.dto.ts`: `LoginDto` con `@IsEmail()` y `@IsString()` en password.
- `src/adapters/controllers/auth.controller.ts`: patrón Adapter documentado inline; `POST /auth/register` retorna 201 `{ token }`, `POST /auth/login` retorna 200 `{ token }`. Solo invoca use cases, sin contacto con IUserRepository.
- `src/adapters/auth.module.ts`: registra `DatabaseModule`, `PassportModule`, `JwtModule.registerAsync` (lee `JWT_SECRET` de `ConfigService`), y cablea `USER_REPOSITORY_TOKEN`, `HASH_SERVICE_TOKEN`, `TOKEN_SERVICE_TOKEN`, `RegisterUseCase`, `LoginUseCase` con `useFactory` (todos framework-free). Registra `JwtStrategy`.
- `src/app.module.ts`: importa `AuthModule`.
- `src/shared/aspects/domain-exception.filter.ts`: añade `[InvalidCredentialsException, HttpStatus.UNAUTHORIZED]` al mapa (OCP — sin tocar lógica de `catch`).
- Tests AAA: `auth.controller.spec.ts` (4 tests: register delega en use case, register propaga UserAlreadyExistsException, login delega en use case, login propaga InvalidCredentialsException — ambos use cases mockeados); `domain-exception.filter.spec.ts` extendido con test para 401.
- `npm test` → 20 suites, 61/61 tests pasan. `npm run build` → exit 0.
**Modificaciones realizadas por el equipo:**

---

## Entrada 015 — back#2: token de sesión largo + Swagger en /auth

**Fecha:** 2026-07-07
**Tarea o problema abordado:** Issue back#2 — documentar el JWT de sesión persistente y anotar los endpoints `/auth` para Swagger. `JWT_EXPIRATION` ya era configurable vía `ConfigService` (default `7d` en `auth.module.ts`), así que el trabajo fue: (1) crear `.env.example` documentando todas las variables incluida `JWT_EXPIRATION`; (2) instalar `@nestjs/swagger` y anotar `AuthController` y los DTOs. Se dejó fuera de alcance el `SwaggerModule.setup()` global en `main.ts` porque corresponde al issue back#3 (OpenAPI global, de Daniel) — así ambos issues componen sin conflicto.
**Herramienta de IA utilizada:** Claude Code (skill arrowmaze-backend, opus)
**Prompt o instrucción proporcionada:** > "Implementar back#2: anotar AuthController y los DTOs con decoradores @nestjs/swagger, crear .env.example documentando JWT_EXPIRATION y JWT_SECRET, mantener verdes los tests de LoginUseCase/RegisterUseCase, no tocar main.ts."
**Resultado obtenido:**
- `package.json`: añade dependencia `@nestjs/swagger@^11.4.5`.
- `.env.example` (nuevo): documenta `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRATION` (con nota de que es de larga duración para la sesión persistente del cliente) y `PORT`.
- `src/adapters/dtos/register.dto.ts` y `login.dto.ts`: añaden `@ApiProperty` (ejemplo, descripción, `minLength` en el password de registro) sin alterar las validaciones de class-validator existentes.
- `src/adapters/controllers/auth.controller.ts`: `@ApiTags('auth')`, `@ApiOperation` y `@ApiResponse` en ambos endpoints. Códigos documentados según el comportamiento REAL de `DomainExceptionFilter`: register 201/400 (UserAlreadyExistsException no está mapeada → cae al default 400, no 409); login 200/401.
- Sin tests unitarios nuevos: los decoradores son metadata declarativa sin lógica de ramificación; los specs existentes de `AuthController`/`LoginUseCase`/`RegisterUseCase` cubren el comportamiento y siguen verdes (justificación explícita por regla 5 de CLAUDE.md).
- `npm run build` → exit 0. `npx eslint` sobre los 3 archivos tocados → limpio. `npm test` → 20 suites, 61/61 tests pasan.
**Modificaciones realizadas por el equipo:**

## Entrada 016 — back#7 (fragmento 1/3): dominio ScoreEntry

**Fecha:** 2026-07-08
**Tarea o problema abordado:** Issue back#7 — modelar el dominio de puntajes que alimenta el Leaderboard (ADR 0001, decisión 7). Primer fragmento: entidad `ScoreEntry` y sus Value Objects. Decisiones de diseño: (1) cada atributo escalar del puntaje es un VO con su invariante en el constructor (consistente con `Position`/`Email`/`LevelId`), no primitivos sueltos; (2) `Stars` acota el rango 1..3 como invariante de dominio; (3) el `score`/`stars` los computa el cliente (front#12) y el backend solo los valida y almacena — no se recomputa en el back; (4) se incluye `ScoreEntryId` como VO por simetría con `UserId`/`LevelId` (toda identidad es concepto de dominio); (5) `createdAt: Date` en la entidad para permitir desempates estables en el leaderboard (Date es builtin, no rompe la pureza del dominio). back#7 se ramificó desde `main` antes de que back#2 (entrada 015) se mergeara; de ahí la numeración consecutiva pese a ser issues independientes.
**Herramienta de IA utilizada:** Claude Code (skill arrowmaze-backend, opus)
**Prompt o instrucción proporcionada:** > "Sí, empecemos con back#7"
**Resultado obtenido:**
- VOs nuevos (`src/domain/value-objects/`): `Score` (entero ≥ 0), `Stars` (entero 1..3), `MoveCount` (entero ≥ 0), `ElapsedTime` (segundos enteros ≥ 0), `ScoreEntryId` (string no vacío). Todos inmutables con `equals`.
- Excepciones de dominio (`src/domain/exceptions/`): `InvalidScoreException`, `InvalidStarsException`, `InvalidMoveCountException`, `InvalidElapsedTimeException`, `InvalidScoreEntryIdException` (extienden `DomainException`; caen al default 400 del `DomainExceptionFilter`, correcto para entrada inválida del cliente).
- Entidad `ScoreEntry` (`src/domain/entities/score-entry.entity.ts`) compone `ScoreEntryId`, `UserId`, `LevelId`, `Score`, `Stars`, `MoveCount`, `ElapsedTime`, `createdAt`.
- Tests AAA: 6 specs, 32 tests verdes (casos válidos, límites e inválidos por VO + composición de la entidad).
**Modificaciones realizadas por el equipo:**

## Entrada 017 — back#7 (fragmento 2/3): puerto IScoreRepository + use-cases SubmitScore/GetLeaderboard

**Fecha:** 2026-07-08
**Tarea o problema abordado:** Segundo fragmento de back#7: capa `application/`. Puerto de persistencia y los dos casos de uso que exige el issue. Decisiones: (1) `SubmitScoreUseCase` recibe un `SubmitScoreCommand` de primitivos y delega la validación a los VOs al construir `ScoreEntry` (entrada inválida → DomainException → 400 antes de tocar el repo); genera el `ScoreEntryId` con `randomUUID()` y el `createdAt` con `new Date()`, igual que `RegisterUseCase`; devuelve la entidad creada para que back#9 pueda mapearla; (2) `GetLeaderboardUseCase` acota el `limit` (default 10, máximo 100, inválidos → default) para proteger el repositorio de paginación abusiva; (3) el ordenamiento del ranking es responsabilidad de la implementación del puerto (fragmento 3), el caso de uso solo pide "top N". Ambos casos de uso son framework-free (sin imports `@nestjs`).
**Herramienta de IA utilizada:** Claude Code (skill arrowmaze-backend, opus)
**Prompt o instrucción proporcionada:** > "Sí, empecemos con back#7" (continuación)
**Resultado obtenido:**
- Puerto `IScoreRepository` (`src/application/ports/i-score.repository.ts`): `save(entry)` + `findTopByLevel(levelId, limit)` + token `SCORE_REPOSITORY_TOKEN`.
- `SubmitScoreUseCase` (`src/application/use-cases/submit-score.use-case.ts`) con `SubmitScoreCommand`.
- `GetLeaderboardUseCase` (`src/application/use-cases/get-leaderboard.use-case.ts`) con `clampLimit`.
- Tests AAA: 2 specs, 7 tests verdes (persistencia + rechazo de stars inválido; default/clamp de límite, propagación de entradas, LevelId vacío). Mocks de `IScoreRepository` e `ILoggerService`.
**Modificaciones realizadas por el equipo:**

## Entrada 018 — back#7 (fragmento 3/3): persistencia Prisma (modelo + PrismaScoreRepository)

**Fecha:** 2026-07-08
**Tarea o problema abordado:** Tercer fragmento de back#7: capa `infrastructure/`. Modelo Prisma `ScoreEntry`, su migración y la implementación del puerto. Decisiones: (1) columnas planas `userId`/`levelId` como `String` **sin FK** — los niveles se siembran en back#10 y pueden no existir al escribir en pruebas; la integridad referencial se documenta como fuera de alcance de este issue; (2) índice compuesto `@@index([levelId, score])` que soporta la consulta del leaderboard (filtra por nivel, ordena por score); (3) ordenamiento del ranking `score desc, createdAt asc` (empate → quien lo logró antes queda arriba); (4) `PrismaScoreRepository` reconstruye los VOs del dominio al leer (patrón Adapter, igual que `PrismaUserRepository`); no filtra tipos generados de Prisma hacia el dominio (interfaz `ScoreEntryRecord` local). **Migración:** el repo maneja el esquema schema-only vía `prisma db push` (no hay carpeta `prisma/migrations/`; así se agregó el modelo `User` en back#2/entrada 012), por lo que **no se commitea un archivo de migración** para no romper esa convención. Se verificó con `prisma migrate diff` que el cambio es aplicable y produce exactamente:
```sql
CREATE TABLE "ScoreEntry" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "levelId" TEXT NOT NULL,
  "score" INTEGER NOT NULL, "stars" INTEGER NOT NULL, "moves" INTEGER NOT NULL,
  "timeSeconds" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScoreEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ScoreEntry_levelId_score_idx" ON "ScoreEntry"("levelId", "score");
```
Aplicar en un entorno con `DATABASE_URL` con `npx prisma db push` (flujo del equipo) o `npx prisma migrate dev --name add_score_entry` si se adopta el historial de migraciones.
**Herramienta de IA utilizada:** Claude Code (skill arrowmaze-backend, opus)
**Prompt o instrucción proporcionada:** > "Sí, empecemos con back#7" (continuación)
**Resultado obtenido:**
- `prisma/schema.prisma`: modelo `ScoreEntry` + índice compuesto. `npx prisma validate` → válido; `npx prisma generate` → cliente regenerado (ahora tipado, incluye `scoreEntry`).
- `PrismaScoreRepository` (`src/infrastructure/database/prisma-score.repository.ts`): implementa `save` y `findTopByLevel` (Adapter). No se cablea a un módulo NestJS: la exposición HTTP (controller + módulo + Swagger) corresponde a back#9.
- Tests AAA: 1 spec, 3 tests verdes (aplanado de VOs a columnas en `save`; forma/orden/límite de la query; reconstrucción de entidades en `findTopByLevel`). PrismaService mockeado (sin BD real).
- Verificación global: `npx jest` → 29 suites, 103/103 tests. `npm run build` → exit 0. `npx eslint` acotado a los archivos tocados → limpio.
**Modificaciones realizadas por el equipo:**

## Entrada 019 — back#9: `POST /scores` y `GET /leaderboard/:levelId`

**Fecha:** 2026-07-08
**Tarea o problema abordado:** Issue back#9 — exponer vía HTTP el dominio de puntajes modelado en back#7 (ScoreEntry, IScoreRepository, SubmitScoreUseCase, GetLeaderboardUseCase). Rama abierta sobre `feat/#7-scoreentry` (aún no mergeada a `main`) porque back#9 depende directamente de ese código; se rebasará/mergeará sobre `main` cuando back#7 aterrice. Decisiones de diseño: (1) un único `ScoreController` para ambos endpoints — comparten el mismo recurso de dominio (ScoreEntry) y cambian juntos, así que separarlos en dos controladores no aportaría cohesión adicional; (2) `POST /scores` protegido con `JwtAuthGuard` (reutiliza la estrategia `'jwt'` ya registrada por `AuthModule`/`JwtStrategy`, sin volver a importar `PassportModule`); el `userId` se toma del token (`req.user.userId`), nunca del body, para que un cliente no pueda falsear puntajes a nombre de otro usuario; (3) `GET /leaderboard/:levelId` es público (ver un ranking no requiere sesión) y acepta `?limit=` opcional — la validación/clamping ya vive en `GetLeaderboardUseCase` (back#7), el controlador solo parsea el string a number; (4) `ScoreMapper` (Adapter, mismo patrón que `LevelMapper`) aplana la entidad + VOs a un DTO plano para la respuesta HTTP.
**Herramienta de IA utilizada:** Claude Code (skill arrowmaze-backend, opus)
**Prompt o instrucción proporcionada:** > "Empecemos con back#9 mientras revisan el PR"
**Resultado obtenido:**
- `ScoreMapper` (`src/adapters/mappers/score.mapper.ts`): `ScoreEntry` → `ScoreEntryResponseDto` plano.
- `SubmitScoreDto` (`src/adapters/dtos/submit-score.dto.ts`): `levelId`, `score`, `stars` (1–3), `moves`, `timeSeconds` con `class-validator` + `@ApiProperty`.
- `ScoreController` (`src/adapters/controllers/score.controller.ts`): `POST /scores` (`@UseGuards(JwtAuthGuard)`, `@ApiBearerAuth()`) y `GET /leaderboard/:levelId` (`@Query('limit')` opcional), ambos anotados con Swagger.
- `ScoreModule` (`src/adapters/score.module.ts`): cablea `SCORE_REPOSITORY_TOKEN` → `PrismaScoreRepository`, `SubmitScoreUseCase` y `GetLeaderboardUseCase` vía `useFactory` (mismo patrón que `LevelModule`/`AuthModule`); registrado en `AppModule`.
- Tests AAA: 2 specs nuevos, 6 tests verdes (`score.mapper.spec.ts`: aplanado de la entidad; `score.controller.spec.ts`: delegación con `userId` del request, propagación de `InvalidScoreException`, parseo de `limit` con y sin query param).
- README actualizado (tabla de endpoints + ejemplos de payload) por exponer API pública nueva.
- Verificación global: `npx jest` → 31 suites, 108/108 tests. `npm run build` → exit 0. `npx eslint` acotado a los archivos tocados → limpio (solo quedan los warnings `no-unsafe-argument` ya presentes en `level.module.ts`/`auth.module.ts` para el mismo patrón `useFactory`).
**Modificaciones realizadas por el equipo:**

## Entrada 020 — back#8: `POST /progress` y `GET /progress`

**Fecha:** 2026-07-08
**Tarea o problema abordado:** Issue back#8 — sincronizar el progreso del jugador (niveles completados + mejores scores, CONTEXT.md "Progress") entre cliente y servidor, autenticado. Bloqueadores (#1, #2) ya mergeados a `main`; rama abierta desde `main` actualizado. Decisiones de diseño: (1) entidad `ProgressEntry` (plana, sin lógica propia, mismo estilo que `ScoreEntry`/`User`) compuesta por `UserId`, `LevelId` y los VOs ya existentes `Score`/`Stars` (reutilizados de back#7, `bestScore`/`bestStars` nullable — un nivel puede completarse sin haber enviado un `ScoreEntry`); identidad natural `(userId, levelId)`, sin id sintético; (2) el **merge vive en `SyncProgressUseCase`, no en la entidad ni en el repositorio**: sync nunca degrada progreso ya persistido — `completed` se combina con OR, `bestScore`/`bestStars` se quedan con el mayor entre lo existente y lo entrante (protege contra un cliente que reinstala y sincroniza con estado local desactualizado); (3) `IProgressRepository` expone `findOne`/`upsert` de bajo nivel (no un método "merge") para mantener el repositorio ignorante de la regla de negocio (SRP); (4) se extrajo `AuthenticatedRequest` (antes solo en `score.controller.ts`) a `adapters/http/authenticated-request.interface.ts` para no duplicarla en `ProgressController`; `score.controller.ts` re-exporta el tipo para no romper su spec existente; (5) modelo Prisma `Progress` con `@@unique([userId, levelId])`, sin migración commiteada (mismo flujo schema-only vía `prisma db push` que `ScoreEntry`/`User`, entrada 018).
**Herramienta de IA utilizada:** Claude Code (skill arrowmaze-backend, Sonnet 5)
**Prompt o instrucción proporcionada:** > "quiero seguir con la siguiente tarea back#8 (progress) asignada en ArrowMaze/docs/superpowers/plans/2026-06-23-critical-path-and-team-split.md"
**Resultado obtenido:**
- `domain/entities/progress-entry.entity.ts`: entidad `ProgressEntry`.
- `application/ports/i-progress.repository.ts`: puerto `IProgressRepository` (`findAllByUser`, `findOne`, `upsert`).
- `application/use-cases/sync-progress.use-case.ts` y `get-progress.use-case.ts`: `SyncProgressUseCase` (merge nunca-degrada) y `GetProgressUseCase`.
- `adapters/dtos/sync-progress.dto.ts`, `adapters/mappers/progress.mapper.ts`, `adapters/controllers/progress.controller.ts`: `POST /progress` y `GET /progress`, ambos `@UseGuards(JwtAuthGuard)` + Swagger; `userId` siempre del token, nunca del body.
- `adapters/progress.module.ts`: cablea `PROGRESS_REPOSITORY_TOKEN` → `PrismaProgressRepository` vía `useFactory` (mismo patrón que `ScoreModule`); registrado en `AppModule`.
- `infrastructure/database/prisma-progress.repository.ts`: `PrismaProgressRepository` (Adapter), `upsert` sobre la clave compuesta `userId_levelId`.
- `prisma/schema.prisma`: modelo `Progress` + `@@unique([userId, levelId])`. `npx prisma generate` → cliente regenerado.
- `adapters/http/authenticated-request.interface.ts`: extracción del tipo compartido (refactor menor, sin cambio de comportamiento).
- Tests AAA: 9 specs nuevos, 20 tests verdes (entidad, ambos casos de uso incluyendo la semántica de merge, mapper, controlador, repositorio Prisma).
- README actualizado (tabla de endpoints + ejemplos de payload) por exponer API pública nueva.
- Verificación global: `npx jest` → 37 suites, 128/128 tests. `npm run build` → exit 0. `npx eslint` acotado a los archivos tocados → limpio (solo quedan los warnings `no-unsafe-argument` en `progress.module.ts` y los errores `unbound-method` en los specs de casos de uso, ambos patrones ya presentes y aceptados en `score.module.ts`/`submit-score.use-case.spec.ts`).
**Modificaciones realizadas por el equipo:**

## Entrada 021 — back#1 F1: demolición de grilla y pipeline de niveles grid

**Fecha:** 2026-07-08
**Tarea o problema abordado:** Fragmento 1/4 del issue back#1 (ADR 0001): retirar el modelo de grilla (ICell, ArrowCell, WallCell, EmptyCell, ExitCell, CellType, CellFactory) y el pipeline de niveles que lo consumía (ILevelRepository, GetLevelUseCase, LevelMapper, LevelController, LevelModule, PrismaLevelRepository y sus specs), dejando la app sirviendo solo auth.
**Herramienta de IA utilizada:** Claude Code
**Prompt o instrucción proporcionada:** > "Ejecutar Fragmento 1 del plan docs/superpowers/plans/2026-07-08-back1-arrow-path-domain.md (issue MazePruebaBack#1)."
**Resultado obtenido:** 17 archivos eliminados; AppModule sin LevelModule; comentarios stale corregidos en logger.module/auth.module/score.module/progress.module; README sin el endpoint de niveles (vuelve en back#5). LevelNotFoundException/InvalidLevelIdException y el mapeo 404 del filter se conservan para back#5. Suite/build verdes (117 tests); eslint limpio en los archivos tocados (la deuda de lint pre-existente del baseline queda fuera del alcance).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 022 — back#1 F2: Direction wire + ArrowId + Arrow arrow-path

**Fecha:** 2026-07-08
**Tarea o problema abordado:** Fragmento 2/4 del issue back#1: Direction pasa a valores wire ('up'|'down'|'left'|'right'); nuevo VO ArrowId (string no vacío) y nueva entidad-dato Arrow (id + cells + headDir) con invariantes de camino (no vacío, adyacencia ortogonal, sin repetidos) e igualdad por valor incluyendo el id. headDir no se valida contra la geometría (decisión del brief, protegida por test).
**Herramienta de IA utilizada:** Claude Code (tests delegados a subagente qa-engineer)
**Prompt o instrucción proporcionada:** > "Ejecutar Fragmento 2 del plan docs/superpowers/plans/2026-07-08-back1-arrow-path-domain.md (issue MazePruebaBack#1)."
**Resultado obtenido:** direction.vo.ts con valores wire; arrow-id.vo.ts (espejo de LevelId) + InvalidArrowIdException; arrow.entity.ts inmutable (cells congeladas) + InvalidArrowException; specs AAA vía TDD (rojo→verde). Suite (135 tests)/build/lint verdes.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 023 — back#1 F3: entidad Level arrow-path

**Fecha:** 2026-07-08
**Tarea o problema abordado:** Fragmento 3/4 del issue back#1: entidad Level (id + cols + rows + arrows + timeLimitSec?) con invariantes: dimensiones enteras >= 1, toda celda de toda flecha dentro de límites, ninguna celda compartida entre flechas, ids de flecha únicos, timeLimitSec entero >= 1 cuando está presente.
**Herramienta de IA utilizada:** Claude Code (tests delegados a subagente qa-engineer)
**Prompt o instrucción proporcionada:** > "Ejecutar Fragmento 3 del plan docs/superpowers/plans/2026-07-08-back1-arrow-path-domain.md (issue MazePruebaBack#1)."
**Resultado obtenido:** level.entity.ts + InvalidLevelException + spec AAA vía TDD (rojo→verde). back#5 construirá Level desde Level.data (Json) con LevelBuilder. Suite (149 tests)/build/lint verdes.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 024 — back#1 F4: ArrowFactory (Factory Method re-fundado)

**Fecha:** 2026-07-08
**Tarea o problema abordado:** Fragmento 4/4 del issue back#1: ArrowFactory como frontera primitivos→dominio para la forma wire { id, headDir, cells }: parsea headDir case-insensitive (InvalidDirectionException), valida la forma de cada celda (InvalidArrowException) y delega los invariantes en ArrowId/Position/Arrow. Re-funda el patrón Factory Method que se perdió al retirar CellFactory (ADR 0001).
**Herramienta de IA utilizada:** Claude Code (tests delegados a subagente qa-engineer)
**Prompt o instrucción proporcionada:** > "Ejecutar Fragmento 4 del plan docs/superpowers/plans/2026-07-08-back1-arrow-path-domain.md (issue MazePruebaBack#1)."
**Resultado obtenido:** arrow.factory.ts (con comentario inline del problema que resuelve el patrón) + InvalidDirectionException + spec AAA vía TDD (rojo→verde). README recupera la fila Factory Method apuntando a arrow.factory.ts. back#5 (repositorio de niveles) y back#10 (seed) la reutilizarán. Suite (163 tests)/build/lint verdes. Ajuste sobre el plan: la comparación del parseo de dirección usa cast explícito a string para satisfacer no-unsafe-enum-comparison.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 025 — back#5 F1: LevelBuilder (Builder re-fundado)

**Fecha:** 2026-07-09
**Tarea o problema abordado:** Fragmento 1/4 del issue back#5: construir un `Level` válido a partir del JSON crudo arrow-path (`Level.data`) sin duplicar las invariantes que ya validan `ArrowFactory` y el constructor de `Level`.
**Herramienta de IA utilizada:** Claude Code (tests delegados a subagente)
**Prompt o instrucción proporcionada:** > "Ejecutar Fragmento 1 del plan back#5 (servir niveles arrow-path vía GET /levels[/:id])."
**Resultado obtenido:** `level.builder.ts` — Builder GoF fluido y step-by-step (`withDimensions().withTimeLimit().addArrow()...build()`), no un método estático único, para que sea un Builder genuino y no un Factory Method redundante con `ArrowFactory` (que `addArrow` usa internamente). Re-funda el patrón pedido por ADR 0001 (decisión 4). `build()` delega las invariantes de tablero en `Level`; no las duplica. Spec AAA (7 tests) sin mocks, mismo estilo que `level.entity.spec.ts`, cubre construcción válida (ejemplo exacto de CONTEXT-MAP.md), `timeLimitSec` omitido/`undefined`, y propagación de `InvalidArrowException`/`InvalidDirectionException`/`InvalidLevelException` desde sus colaboradores. Suite verde (170 tests).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 026 — back#5 F2: ILevelRepository + GetLevelUseCase + ListLevelsUseCase

**Fecha:** 2026-07-09
**Tarea o problema abordado:** Fragmento 2/4 del issue back#5: puerto de persistencia de niveles y los dos casos de uso que necesitan `GET /levels` (lista) y `GET /levels/:id` (detalle).
**Herramienta de IA utilizada:** Claude Code (tests delegados a subagente)
**Prompt o instrucción proporcionada:** > "Ejecutar Fragmento 2 del plan back#5 (servir niveles arrow-path vía GET /levels[/:id])."
**Resultado obtenido:** `i-level.repository.ts` (`ILevelRepository.findById`/`findAllOrdered` + `LEVEL_REPOSITORY_TOKEN`, mismo patrón que `i-progress.repository.ts`/`i-score.repository.ts`). `get-level.use-case.ts`: parsea el id crudo a `LevelId` (propaga `InvalidLevelIdException`), lanza `LevelNotFoundException` si el repo devuelve `null`. `list-levels.use-case.ts`: delega en `findAllOrdered`. Ambos framework-free, sin `@Injectable()`, mismo estilo que `get-leaderboard.use-case.ts`. Specs AAA con mocks (`jest.Mocked<ILevelRepository>`/`jest.Mocked<ILoggerService>`), mismo estilo que `get-leaderboard.use-case.spec.ts`. Suite verde (175 tests).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 027 — back#5 F3: columna `order` + PrismaLevelRepository

**Fecha:** 2026-07-09
**Tarea o problema abordado:** Fragmento 3/4 del issue back#5: persistencia. El modelo `Level` no tenía forma de expresar el orden de juego ("GET /levels lista ids en orden"); se decidió una columna explícita en vez de depender de `createdAt` porque el seed curado (back#10) necesita control expreso de la secuencia, no solo el de inserción.
**Herramienta de IA utilizada:** Claude Code (tests escritos directamente — el subagente de tests fue bloqueado por el clasificador de auto mode por un bloque de instrucciones de un plugin MCP inyectado automáticamente en el contexto de todo agente nuevo; no es un problema de este fragmento)
**Prompt o instrucción proporcionada:** > "Ejecutar Fragmento 3 del plan back#5 (servir niveles arrow-path vía GET /levels[/:id])."
**Resultado obtenido:** `schema.prisma`: `Level.order Int @unique`. `prisma-level.repository.ts`: `@Injectable()`, implementa `ILevelRepository`; `toDomain` privado y estático reconstruye `Level` desde `record.data` vía `LevelBuilder` (mismo patrón `*Record` local que `prisma-progress.repository.ts`, para no filtrar tipos de Prisma al dominio). Se sigue la práctica real del repo (sin `prisma/migrations/` versionado, `db push`) sobre lo que documenta el README, por decisión explícita del usuario. Spec con mocks de `PrismaService` (5 tests), mismo estilo que `prisma-progress.repository.spec.ts`. Suite verde (180 tests). Pendiente: aplicar `db push` contra la DB local (Postgres estaba detenido, requiere permisos de admin) — se aplicará en la verificación final.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 028 — back#5 F4: LevelMapper + LevelController + LevelModule + Swagger + README

**Fecha:** 2026-07-09
**Tarea o problema abordado:** Fragmento 4/4 del issue back#5: exponer `GET /levels` y `GET /levels/:id` por HTTP, cerrando el DoD del issue (endpoints documentados en Swagger, README actualizado).
**Herramienta de IA utilizada:** Claude Code (tests escritos directamente por el mismo bloqueo del clasificador de auto mode descrito en la entrada 027)
**Prompt o instrucción proporcionada:** > "Ejecutar Fragmento 4 del plan back#5 (servir niveles arrow-path vía GET /levels[/:id])."
**Resultado obtenido:** `level.mapper.ts` (`LevelMapper.toDto`/`toSummaryDto`, DTOs planos sin decoradores, mismo estilo que `score.mapper.ts`). `level.controller.ts`: `@Controller('levels')` (estilo `ProgressController`), `GET /` → `ListLevelsUseCase` → ids en orden; `GET /:id` → `GetLevelUseCase` → nivel completo; decorado con `@ApiTags`/`@ApiOperation`/`@ApiResponse` incl. 404. `level.module.ts` wireado en `app.module.ts` (mismo patrón `useFactory` que `score.module.ts`). README: fila de endpoints, ejemplos de payload, patrón Builder añadido a la tabla de Design Patterns, descripción actualizada (ya no dice "grid retirado, vuelve en back#5" — ya volvió). Specs de controller (3 tests) con mocks de use cases, mismo estilo que `score.controller.spec.ts`. Suite verde (183 tests); `npm run build` y `npx eslint` sobre los archivos tocados limpios salvo los mismos patrones ya aceptados (`no-unsafe-argument` en `*.module.ts`, `unbound-method` en specs de casos de uso).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 029 — fix(back/adapters): AuthModule inyectaba JwtService por string token roto

**Fecha:** 2026-07-09
**Tarea o problema abordado:** No forma parte de back#5. Al hacer el smoke test end-to-end de back#5 (`npm run start:dev` + curl contra `GET /levels[/:id]`), la app entera fallaba al arrancar: `UnknownDependenciesException` resolviendo `ITokenService`. `auth.module.ts` inyectaba `JwtService` de `@nestjs/jwt` vía el token string `'JwtService'` (`inject: ['JwtService']`), pero `JwtModule` registra `JwtService` bajo la referencia de la clase, no bajo ese string — bug preexistente desde que se creó `AuthModule` (commit `fad9588`), nunca detectado porque ningún test unitario/controller bootstrapea Nest de verdad y nadie había corrido `start:dev` antes en esta sesión.
**Herramienta de IA utilizada:** Claude Code
**Prompt o instrucción proporcionada:** > "Ya esta prendido postgres" (retomando la verificación de back#5; el fix surgió como bloqueante del smoke test, no fue pedido explícitamente).
**Resultado obtenido:** `inject: ['JwtService']` → `inject: [JwtService]` (import de la clase agregado), comentario inline corregido. Suite (183 tests) y build siguen verdes. Con el fix, `npm run start:dev` arranca limpio y el smoke test de back#5 pasó: `GET /levels` → `[{"levelId":"l-007"}]`; `GET /levels/l-007` → JSON arrow-path completo igual al wire contract; `GET /levels/no-existe` → 404 con el shape uniforme de `DomainExceptionFilter`.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 030 — back#5: test de smoke de wiring de DI (cierra el hueco de la 029)

**Fecha:** 2026-07-09
**Tarea o problema abordado:** La entrada 029 arreglo un bug de DI de `AuthModule` que sobrevivio desde `fad9588` porque ningun test bootstrapea Nest; el fix quedo sin cobertura y una regresion del mismo tipo volveria a pasar desapercibida hasta el arranque. Anadir el test que faltaba y verificar el modulo en vivo.
**Herramienta de IA utilizada:** Claude Code (revision con skills arrowmaze-code-reviewer, arrowmaze-qa, arrowmaze-backend)
**Prompt o instruccion proporcionada:** > "Anade lo que hace falta y comprueba entonces que el modulo funcione correctamente (aparte de los tests)"
**Resultado obtenido:** Nuevo `src/app.module.spec.ts`: smoke test de wiring que compila el `AppModule` completo con `Test.createTestingModule` y `PrismaService` sobre-escrito (sin BD, `compile()` no invoca `onModuleInit`). Corre bajo `npm test`, cerrando el hueco de que la suite por defecto nunca bootstrapeaba Nest. Verificado por mutacion: reintroduciendo `inject: ['JwtService']` el test falla con `UnknownDependenciesException` (no es autocomplaciente); restaurado el fix, verde. Suite 43 suites / 184 tests; `npm run build` y `npx eslint` limpios. Verificacion en vivo (`node dist/src/main.js`, aparte de los tests): la app arranca con `AuthModule dependencies initialized` sin errores; `GET /levels` -> `[{"levelId":"l-007"}]`; `GET /levels/l-007` -> wire contract completo; `GET /levels/no-existe` -> 404 `LevelNotFoundException`; `POST /auth/register` y `POST /auth/login` devuelven un JWT real (prueba que el `JwtService` recableado firma tokens end-to-end); login con password erronea -> 401 `InvalidCredentialsException`. Nota lateral no corregida (fuera de scope): `npm run start:prod` apunta a `node dist/main` pero `nest build` emite `dist/src/main.js` (script preexistente roto).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 031 — back#6: LevelSolver (solubilidad + Solución canónica)

**Fecha:** 2026-07-09
**Tarea o problema abordado:** Issue #6 — servicio de dominio `LevelSolver` que valida que un `Level` arrow-path se puede vaciar y produce la Solución canónica (orden de remoción, ADR 0002).
**Herramienta de IA utilizada:** Claude Code (plan `back6-level-solver.md` + TDD con subagente QA)
**Prompt o instrucción proporcionada:** > "Ejecutar el plan de back#6: LevelSolver con solve()/isSolvable(), espejo de la geometría de salida del front, greedy por monotonicidad (ADR 0001 dec. 6)."
**Resultado obtenido:** `src/domain/services/level-solver.ts` — `solve(level): ArrowId[] | null` e `isSolvable(level): boolean`, dominio puro sin dependencias; greedy determinista con reinicio de escaneo, geometría espejo de `arrow.dart` (`exitPath`) y `arrow_board.dart` (`canExit`). Spec AAA `level-solver.spec.ts` (9 casos: vacío, carril libre, cabeza al borde, bloqueo mutuo cíclico, orden-dependiente, serpiente doblada soluble/insoluble, invarianza y determinismo). Glosario: **Solvable** y **Solution** en `CONTEXT.md`.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 032 — back#10: seed de 15 niveles curados (fixtures + seed + wiring)

**Fecha:** 2026-07-10
**Tarea o problema abordado:** Issue #10 — curar 15 niveles de los 30 candidatos congelados del generador (front#1), congelarlos como fixtures arrow-path en el back y sembrarlos en Postgres con orden explícito y dificultad progresiva; cada nivel debe pasar `LevelSolver` (ADR 0001 dec. 5).
**Herramienta de IA utilizada:** Claude Code (handoff `handoff-back10-seed-levels.md`, skill superpowers:executing-plans)
**Prompt o instrucción proporcionada:** > "Lee el handoff y ejecuta el plan para resolver el issue #10 de github."
**Resultado obtenido:** Selección determinista (Decisión 2): por tier, de los candidatos solubles se eligió el de menor-seed con mínimas flechas, el de menor-seed con máximas flechas y el menor-seed restante; orden = tier asc, luego nº de flechas asc. Un script throwaway (ts-node) confirmó que los 30 candidatos son solubles bajo `LevelSolver`. Elegidos: level-01..03 ← t1 s101/s102/s104 (5/5/6 flechas, 6×8); 04..06 ← t2 s201/s202/s204 (7/7/8, 7×10); 07..09 ← t3 s301/s302/s305 (9/9/11, 8×11); 10..12 ← t4 s401/s402/s405 (12/12/14, 9×13, timeLimit 120); 13..15 ← t5 s501/s502/s505 (15/15/18, 11×15, timeLimit 180). Artefactos: `prisma/levels/level-01.json`..`level-15.json` (fixture declarativo `{levelId, order, cols, rows, timeLimitSec?, arrows verbatim del candidato}`) + `prisma/levels/manifest.md` (procedencia + regla). `prisma/seed.ts`: carga fixtures → valida TODO el lote reconstruyendo cada `Level` vía `LevelBuilder` y exigiendo `isSolvable` (fail-fast, lanza antes de cualquier escritura) → upsert idempotente por id; `data` = `{cols, rows, timeLimitSec?, arrows}` (excluye levelId/order, que son columnas de tabla). Wiring: `migrations.seed` en `prisma.config.ts` (Prisma 6 lo lee de ahí — no de `package.json#prisma.seed`, que quedaría ignorado si el config lo definiera) + script `db:seed` en `package.json`. README: sección "Seeding levels". Sin migración ni columna de dificultad (dificultad = order, Decisión 4). Verificación: `npm run build` limpio; los 15 fixtures se validan solubles + rampa + límites de tiempo por la spec de la Entrada 033. Desviación vs handoff: el seed se cableó en `prisma.config.ts` en vez de `package.json` porque el repo ya usa config file (el handoff no lo contemplaba).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 033 — test(back): spec de solubilidad y rampa de los niveles curados

**Fecha:** 2026-07-10
**Tarea o problema abordado:** back#10 (Decisión 9) — spec unitaria (sin DB) que verifica los 15 fixtures curados: que todos construyen y son solubles, la rampa de dificultad y los límites de tiempo por tier.
**Herramienta de IA utilizada:** Claude Code (skill superpowers:executing-plans + arrowmaze-backend)
**Prompt o instrucción proporcionada:** > "Lee el handoff y ejecuta el plan para resolver el issue #10 de github."
**Resultado obtenido:** `src/infrastructure/database/curated-levels.spec.ts` (AAA, 24 tests): (a) los 15 fixtures se cargan desde `prisma/levels`, cada uno se reconstruye vía `LevelBuilder` y `LevelSolver.isSolvable` lo declara soluble; (b) rampa — ids `level-01..15`, `order` 1..15 único y contiguo, dims no-decrecientes por orden, nº de flechas no-decreciente dentro de cada tier (agrupado por dims); (c) límites — orders 10..12 (t4) `timeLimitSec===120`, 13..15 (t5) `===180`, 1..9 (t1–t3) `undefined`. Lee los fixtures desde `process.cwd()/prisma/levels` (jest corre desde la raíz; rootDir=src). Suite completa: 45 suites/219 tests verdes; `npm run build` limpio. La deuda de lint es preexistente (82 problemas en 23 archivos ajenos); los archivos nuevos pasan lint limpio y la spec está en el scope de `npm run lint`.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 034 — style(back): saldo de la deuda de lint (58 errores → 0)

**Fecha:** 2026-07-12
**Tarea o problema abordado:** back#4 (prerequisito) — el gate de lint del CI nacería en rojo: `eslint` sin `--fix` reportaba 58 errores en 18 archivos (82 problemas en 23 contando warnings, la deuda ya anotada en la Entrada 033). Se salda la deuda para que el check obligatorio sea verde desde el primer PR.
**Herramienta de IA utilizada:** Claude Code
**Prompt o instrucción proporcionada:** > "Necesito que tomes el issue 4 y lo implementes. En una rama distinta y sin hacer merge, solo pull request"
**Resultado obtenido:** (a) 36 errores auto-arreglables corregidos con `eslint --fix` (formato prettier + `no-unnecessary-type-assertion`, 11 archivos). (b) `register.use-case.spec.ts`: los stubs `id: {} as any` / `password: {} as any` (2× `no-unsafe-assignment`) se reemplazan por un `User` real con `UserId`/`Email`/`HashedPassword` — el spec ahora ejercita los value objects genuinos. (c) Los 20 `unbound-method` restantes eran el falso positivo documentado de `expect(mock.method)` en Jest (los 20 en archivos `*.spec.ts`); se añade un override en `eslint.config.mjs` que apaga la regla base solo para `**/*.spec.ts`, sin dependencias nuevas (package-lock intacto). Mejora futura anotada en el propio override: adoptar `jest/unbound-method` de `eslint-plugin-jest` (la variante consciente de mocks que recomienda typescript-eslint) para recuperar la detección de usos realmente inseguros en tests. (d) Nuevo script `lint:check` (eslint sin `--fix`) como comando de verificación para CI y local. Verificación: `npm run lint:check` → 0 errores (19 warnings, severidad `warn` deliberada en la config); suite 45/219 verde; `npm run build` limpio.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 035 — ci(back): workflow de GitHub Actions (lint+test+build) + badge

**Fecha:** 2026-07-12
**Tarea o problema abordado:** back#4 — workflow de CI que corre lint + tests + build en cada PR y reporta estado como check; badge de build real en el README; `main` protegida con checks obligatorios (paso manual de configuración del repo, documentado en el PR).
**Herramienta de IA utilizada:** Claude Code
**Prompt o instrucción proporcionada:** > "Necesito que tomes el issue 4 y lo implementes. En una rama distinta y sin hacer merge, solo pull request"
**Resultado obtenido:** `.github/workflows/ci.yml`: dispara en `pull_request` (todas las ramas) y en `push` a `main` (para que el badge refleje el estado real de main); job único `ci` ("lint · test · build") en `ubuntu-latest` con Node 22 + caché npm: `npm ci` → `npx prisma generate` → `npm run lint:check` → `npm test` → `npm run build`. Hallazgos incorporados: `prisma.config.ts` exige `DATABASE_URL` al cargarse aunque `generate` no conecte (se inyecta URL dummy a nivel de job) y sin `prisma generate` el build falla (TS2694 en `prisma/seed.ts` contra el stub de `@prisma/client`). `concurrency` cancela corridas obsoletas del mismo PR; `permissions: contents: read` (mínimo privilegio). README: los badges estáticos de tests/build se reemplazan por el badge dinámico del workflow (`?branch=main`) y la sección Contributing documenta el gate y cómo reproducirlo localmente. La protección de `main` (require PR + check `CI / lint · test · build` verde) no es automatizable desde el código del repo: queda como paso de configuración en Settings → Branches, detallado en el PR.
## Entrada 034 — back#3: code estable legible por máquina en DomainException

**Fecha:** 2026-07-12
**Tarea o problema abordado:** back#3 (Swagger global + errores HTTP consistentes) — fragmento 1: el contrato de error uniforme `{statusCode, code, message}` necesita un identificador estable del tipo de error; `exception.name` (nombre de clase) no es un código de API sino un detalle de implementación TypeScript.
**Herramienta de IA utilizada:** Claude Code (skill arrowmaze-backend, TDD rojo→verde)
**Prompt o instrucción proporcionada:** > "Toma el issue 3 del back y desarrollalo. Este issue tiene que ser desarrollado en una rama propia y debes de hacer solo hasta el pull request, no el merge"
**Resultado obtenido:** `DomainException` gana `readonly code: string`, derivado del nombre de la subclase en SCREAMING_SNAKE sin el sufijo Exception (`LevelNotFoundException` → `LEVEL_NOT_FOUND`), con override opcional por parámetro para subclases que necesiten desacoplar el código del nombre de clase. Ninguna subclase existente requiere cambios (el parámetro es opcional). `domain.exception.spec.ts` (AAA, 4 tests): derivación, sufijo, override explícito y preservación de name/message/cadena de prototipos.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 035 — back#3: contrato de error uniforme {statusCode, code, message} + 409 Conflict

**Fecha:** 2026-07-12
**Tarea o problema abordado:** back#3 — fragmento 2: `DomainExceptionFilter` emitía `{statusCode, error: <nombre de clase>, message}` (detalle de implementación filtrado al contrato) y `UserAlreadyExistsException` caía al default 400 en vez del 409 semánticamente correcto.
**Herramienta de IA utilizada:** Claude Code (skill arrowmaze-backend, TDD rojo→verde)
**Prompt o instrucción proporcionada:** > "Toma el issue 3 del back y desarrollalo."
**Resultado obtenido:** El cuerpo de error pasa a `{statusCode, code, message}` con `code = DomainException.code` (Entrada 034); los clientes discriminan por `code`, nunca por `message`. Registro de estados completado: `UserAlreadyExistsException → 409 CONFLICT` (además de 404/401 existentes; el resto cae a 400, nunca 500). `@ApiResponse` de `POST /auth/register` actualizado de 400 → 409 y eliminado el comentario que documentaba el mapeo ausente. Spec del filtro reescrita al nuevo contrato + caso 409 (4 tests); nombre del test de propagación en `auth.controller.spec.ts` corregido (400→409). El front no parsea el cuerpo de error (discrimina por status HTTP vía Dio), así que el cambio de `error`→`code` no lo rompe.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 036 — back#3: OpenAPI global servido en /api vía DocumentBuilder

**Fecha:** 2026-07-12
**Tarea o problema abordado:** back#3 — fragmento 3: los controladores ya tenían decoradores Swagger (@ApiTags/@ApiOperation/@ApiResponse) pero `main.ts` nunca cableó `SwaggerModule`, así que `/api` no servía nada.
**Herramienta de IA utilizada:** Claude Code (skill arrowmaze-backend)
**Prompt o instrucción proporcionada:** > "Toma el issue 3 del back y desarrollalo."
**Resultado obtenido:** `src/app.setup.ts` con `configureApp(app)`: ValidationPipe global (movido desde main.ts) + `DocumentBuilder` (título, descripción, versión, `addBearerAuth`) + `SwaggerModule.setup('api', …)` — UI en `/api`, JSON en `/api-json`. `main.ts` reducido a `create → configureApp → listen`; la extracción existe para que las e2e (fragmento 4) apliquen exactamente la misma configuración que producción (sin drift). `ErrorResponseDto` (`adapters/dtos/error-response.dto.ts`, solo anotaciones @ApiProperty) documenta el contrato `{statusCode, code, message}` y se referencia en los @ApiResponse de error que sí produce el filtro de dominio: login 401, register 409, level 404. Deliberadamente NO se referencia en los 401 de los guards JWT ni en los 400 de ValidationPipe: esos cuerpos los construye Nest con su forma estándar, no el filtro — documentar lo real, no lo asumido. README: aviso de `/api`//`/api-json` + ejemplo de error actualizado + mapeo 409. Sin tests unitarios propios: `configureApp` es glue de composición sin lógica y `ErrorResponseDto` es una clase de anotaciones; su contraparte de verificación son las e2e del fragmento 4 (forma de error real + documento OpenAPI servido).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 037 — back#3: e2e del contrato de error y del documento OpenAPI

**Fecha:** 2026-07-12
**Tarea o problema abordado:** back#3 — fragmento 4: no existía ninguna prueba e2e (test/ solo tenía el jest-e2e.json de plantilla y el script llevaba --passWithNoTests); los criterios de aceptación piden verificar extremo a extremo la forma de error y que el JSON de Swagger se sirve.
**Herramienta de IA utilizada:** Claude Code (skill arrowmaze-backend)
**Prompt o instrucción proporcionada:** > "Toma el issue 3 del back y desarrollalo."
**Resultado obtenido:** `test/create-test-app.ts`: helper que levanta el AppModule real con `overrideProvider(PrismaService)` → mock (`user.findUnique/create`, `level.findUnique/findMany`) — las e2e verifican el contrato HTTP, no la persistencia, y corren sin Postgres; aplica `configureApp` compartido con main.ts, así que pipes y OpenAPI son exactamente los de producción; `JWT_SECRET` de test si no está definido. `error-contract.e2e-spec.ts` (3 tests, AAA): 404 LEVEL_NOT_FOUND, 401 INVALID_CREDENTIALS, 409 USER_ALREADY_EXISTS — `toEqual` estricto prueba que el cuerpo es EXACTAMENTE `{statusCode, code, message}`. `openapi.e2e-spec.ts` (3 tests): `/api-json` responde OpenAPI 3 con los 7 paths de la API y el esquema `ErrorResponseDto` con las tres propiedades; `/api` sirve la UI (HTML). `--passWithNoTests` retirado del script `test:e2e` — con specs reales solo enmascararía errores de configuración. Suite e2e: 2 suites/6 tests verdes.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 038 — back#3: fixes de la revisión adversaria multi-agente

**Fecha:** 2026-07-12
**Tarea o problema abordado:** back#3 — hallazgos confirmados por la revisión adversaria (workflow de 4 dimensiones × 3 refutadores por hallazgo) antes de abrir el PR.
**Herramienta de IA utilizada:** Claude Code (workflow multi-agente ultracode: review + verificación adversaria)
**Prompt o instrucción proporcionada:** > "Toma el issue 3 del back y desarrollalo. [...] solo hasta el pull request, no el merge"
**Resultado obtenido:** 3 hallazgos confirmados, 3 fixes: (1) el cuerpo del filtro y `ErrorResponseDto` duplicaban el contrato sin vínculo de compilación → `DomainErrorBody` en `shared/contracts/` que el filtro usa para tipar el body y el DTO `implements` — renombrar un campo ahora rompe el build en ambos sitios en vez de divergir en silencio; (2) el comentario de `DomainException` definía `code` en términos del "contrato HTTP público" (doc del núcleo acoplada a un adaptador) → reformulado transport-agnóstico; (3) `openapi.e2e-spec` solo comprobaba que `ErrorResponseDto` existía en `components` — una regresión que quitara el `type:` de un endpoint quedaba verde → nueva prueba que fija el `$ref` exactamente donde responde el filtro (404 level, 401 login, 409 register) y su ausencia en los 401 de guards JWT. Hallazgos no confirmados descartados con razón (subclases de excepciones mapeadas: no existen; minificación de constructor.name: backend no minificado; default 400 sin e2e: cubierto por spec unitaria). Verificación: 46 suites/224 unitarios + 7 e2e verdes, build y lint limpios.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 039 — back#19: servir la Solución del nivel (GET /levels/:id/solution)

**Fecha:** 2026-07-13
**Tarea o problema abordado:** back#19 — exponer vía HTTP la Solución que certifica `LevelSolver` (ADR 0002): el orden de `ArrowId` que vacía un `Level` arrow-path. Incluye dos extensiones técnicas: validación sintáctica del parámetro de ruta `:id` (400 antes de tocar el repositorio) y logging enriquecido de auditoría en el camino 422.
**Herramienta de IA utilizada:** Claude Code (opus, rol Senior Backend Dev)
**Prompt o instrucción proporcionada:** > "Actúa como Senior Backend Dev para el Issue Back #19. [...] Validación de Ruta: implementa un Pipe/Validador para el :id. Logging Enriquecido para 422: al lanzar UnsolvableLevelException, adjunta un objeto de contexto con levelId y metadatos del mapa. Ejecuta la codificación, tests de Jest y actualiza el issue."
**Resultado obtenido:**
- Endpoint `GET /levels/:id/solution` → `{ levelId, solution: string[] }` (ids en orden de vaciado). `GetSolutionUseCase` framework-free (puertos + `LevelSolver` por DIP): 404 `LevelNotFoundException` si el nivel no existe, **422 `UnsolvableLevelException`** si no admite Solución.
- **Validación de ruta:** `LevelIdValidationPipe` (`adapters/pipes/`) rechaza un `:id` sintácticamente corrupto con **400 antes de golpear el repositorio**. El proyecto NO usa UUID/MongoId: `LevelId` es un slug minúsculas (`level-01`) → se valida `^[a-z0-9]+(?:-[a-z0-9]+)*$` (≤64). Lanza `InvalidLevelIdException` (excepción de dominio) a propósito, para servir el MISMO cuerpo uniforme `{ statusCode, code, message }` del resto de la API en vez del body por defecto de Nest. Aplicado a `:id` en `getById` y `getSolution`.
- **Logging enriquecido 422:** en el camino insoluble se registra a nivel `error` no solo el mensaje sino un objeto de auditoría serializado `{ levelId, cols, rows, arrowCount, arrowIds }`; el mismo contexto se adjunta a la excepción. El cuerpo servido al cliente nunca lo filtra (verificado por test).
- `UnsolvableLevelException` (código auto-derivado `UNSOLVABLE_LEVEL`) mapeada a **422** en `DomainExceptionFilter`; `LevelSolver` provisto por DI en `LevelModule` (`useFactory`, servicio de dominio puro).
- Verificación: **48 suites/250 unitarios + 3 suites/11 e2e** verdes (nuevo e2e cubre 200/400/404/422 por el AppModule real); `lint:check` sin errores y `nest build` limpio.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 040 — back#24 — Username value object (backend de front#50)

**Fecha:** 2026-07-13
**Tarea o problema abordado:** Fragmento 1/4 de back#24 (backend del leaderboard con username, que desbloquea front#50): crear el Value Object de dominio `Username` (VO puro, sin dependencias de framework) con su validación de invariante (3–20 caracteres, charset `^[A-Za-z0-9_]+$`) y su excepción `InvalidUsernameException`. Sigue el patrón establecido por `Email` VO (entrada 002, Task 2A.1) para mantener consistencia arquitectónica.
**Herramienta de IA utilizada:** Claude Code (agent dedicado a Task B1)
**Prompt o instrucción proporcionada:** > "Implementa Task B1 (back#24): Username VO + exception, siguiendo TDD — test que falla (RED), implementar exception, implementar VO, test que pasa (GREEN), AI_HISTORY + commit exacto."
**Resultado obtenido:**
- `src/domain/value-objects/username.vo.ts`: VO inmutable (`readonly value: string`), valida mediante regex `^[A-Za-z0-9_]{3,20}$` en el constructor lanzando `InvalidUsernameException` si falla, método `equals` por valor (idéntico al patrón de `Email` VO, sin `toLowerCase` porque usernames son case-sensitive por diseño). Comentario inline documentando el patrón y el invariante.
- `src/domain/exceptions/invalid-username.exception.ts`: clase que extiende `DomainException`, mismo patrón que `InvalidEmailException`/`InvalidScoreException`.
- `src/domain/value-objects/username.vo.spec.ts`: tests AAA (7 tests totales) — (1) acepta un username válido (`player_01`), (2) igualdad true/false entre instancias, (5) rechaza casos inválidos (< 3 chars, > 20 chars, caracteres prohibidos, espacios, string vacío), todos vía `it.each`.
- TDD verificado: test corre como GREEN inmediato tras implementación (`npx jest src/domain/value-objects/username.vo.spec.ts` → `7 passed`). Suite global de Jest: 44 suites, 191 tests pasan.
- Nota de verificación honesta: `npx tsc --noEmit` de todo el proyecto **falla** por un error **preexistente** en `src/infrastructure/database/prisma-level.repository.ts` (el cliente Prisma en disco está desactualizado y le falta `Level.order`, que sí existe en `schema.prisma`). Es ajeno a este fragmento (viene heredado de `origin/main`) y se resolverá al regenerar el cliente Prisma en el fragmento de esquema (B2). Los tests de Jest no dependen de ese build.
- Sin cambios en API pública HTTP (capa `domain/`, consumida más adelante en back#24 para validar/almacenar usernames); README.md no modificado.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 041 — back#24 — columna username en User (schema + backfill helper)

**Fecha:** 2026-07-13
**Tarea o problema abordado:** Fragmento 2/4 de back#24: añadir `username String @unique` (requerido) al modelo `User` en `schema.prisma` y regenerar el cliente Prisma. Al hacerlo se descubrió y resolvió un conflicto de flujo: el spec/plan asumía una **migración Prisma** con backfill inline, pero este repo **no usa migraciones** — el flujo del equipo es `npx prisma db push` (no existe `prisma/migrations/` en `origin/main`; cf. entrada 030). Se descartó la carpeta de migración generada por error y se adoptó el flujo `db push`.
**Herramienta de IA utilizada:** Claude Code (agent dedicado a Task B2 + orquestador)
**Prompt o instrucción proporcionada:** > "Task B2 (back#24): schema + backfill de username, SIN aplicar (no hay BD esta sesión); alinear al flujo real del repo."
**Resultado obtenido:**
- `prisma/schema.prisma`: `User` gana `username String @unique` (requerido). Fuente de verdad para `db push`.
- `prisma/backfill-username.sql`: helper SQL con la receta de aplicación bajo `db push` (BD desechable → `db push` directo; BD con datos → nullable/backfill/required en 3 pasos). El backfill usa `'player_' || substr(id,1,8)`, coherente con la invariante del VO `Username`.
- `npx prisma generate` ejecutado (sin BD; lee `schema.prisma`): el cliente ahora incluye `username`, y de paso incorpora `Level.order`, resolviendo el error de tsc preexistente reportado en la entrada 040.
- **Verificación honesta — NADA se aplicó a ninguna BD** (no hay `DATABASE_URL`/Postgres esta sesión, decisión del usuario). El usuario debe aplicar el esquema con `npx prisma db push` y el backfill según `prisma/backfill-username.sql` cuando tenga BD. No se afirma que la migración/backfill se haya ejecutado ni verificado contra datos.
- **Estado transitorio de build:** tras regenerar el cliente, el árbol de trabajo falla `tsc` en `prisma-user.repository.ts` porque `UserCreateInput` ya exige `username` pero la entidad/repo aún no lo cablean — eso se completa en el fragmento 3/4 (registro con username), que deja el build en verde. El contenido de ESTE commit es solo esquema + SQL + doc (sin TypeScript).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 042 — back#24 — Registro requiere username único (front#50)

**Fecha:** 2026-07-13
**Tarea o problema abordado:** Fragmento 3/4 de back#24: cablear `username` de punta a punta en el registro. `User` gana `username: Username`; `IUserRepository` gana `findByUsername`; `RegisterUseCase.execute` pasa a firma `(rawEmail, rawUsername, plainPassword)` y valida unicidad de username además de email; `RegisterDto` y `AuthController.register` propagan el campo; `PrismaUserRepository` lee/escribe `username`. Nueva `UsernameAlreadyTakenException` (mismo patrón que `UserAlreadyExistsException`). Este fragmento deja `npx tsc --noEmit` en verde (estaba rojo desde el fragmento 2/4 por diseño, ya que `UserCreateInput` exigía `username` sin que el repo lo cableara).
**Herramienta de IA utilizada:** Claude Code (agent dedicado a Task B3)
**Prompt o instrucción proporcionada:** > "Implementa Task B3 (back#24): registro requiere username único, siguiendo TDD — spec que falla (RED) por firma/API inexistente, implementar entidad/puerto/caso de uso/repo/DTO/controller, specs que pasan (GREEN), tsc verde, AI_HISTORY + README + commit."
**Resultado obtenido:**
- `src/domain/entities/user.entity.ts`: constructor gana tercer parámetro `username: Username` (orden `id, email, username, password`).
- `src/domain/exceptions/username-already-taken.exception.ts`: nueva, extiende `DomainException`, mismo patrón que `UserAlreadyExistsException`.
- `src/application/ports/i-user.repository.ts`: nuevo método `findByUsername(username: Username): Promise<User | null>`.
- `src/application/use-cases/register.use-case.ts`: `execute(rawEmail, rawUsername, plainPassword)` — valida email libre, luego username libre (`UsernameAlreadyTakenException` si no), antes de hashear password y guardar.
- `src/infrastructure/database/prisma-user.repository.ts`: `findByUsername` vía `prisma.user.findUnique({ where: { username } })`; `save` persiste `username`; `toDomain` privado estático reconstruye el nuevo shape de `User`.
- `src/adapters/dtos/register.dto.ts`: campo `username` con `@IsString() @MinLength(3) @MaxLength(20) @Matches(/^[A-Za-z0-9_]+$/)`, espejando el invariante del VO `Username` en la capa HTTP (fail-fast antes de llegar al dominio).
- `src/adapters/controllers/auth.controller.ts`: `register` pasa `dto.username` al use case.
- Specs actualizados: `register.use-case.spec.ts` (reescrito — firma de 3 args, caso "username libre", caso "username tomado" → `UsernameAlreadyTakenException`, mock de `findByUsername`); `prisma-user.repository.spec.ts` (`username` en records mockeados, aserción en `save`, nuevo `describe('findByUsername', ...)` con 2 tests espejando `findByEmail`); `login.use-case.spec.ts` y `auth.controller.spec.ts` (`new User(...)`/DTOs/aserciones actualizados al nuevo shape de 4 args y 3 args respectivamente).
- TDD verificado: `npx jest src/application/use-cases/register.use-case.spec.ts` en rojo antes de crear la excepción/campo (`Cannot find module '.../username-already-taken.exception'`); verde tras implementar los pasos 3-9 del brief.
- Verificación final: `npx jest` → 44 suites / 194 tests, todo verde. `npx tsc --noEmit` → exit 0 (sin errores), confirmando que el fragmento cierra el estado rojo heredado del fragmento 2/4.
- **Verificación honesta — sin base de datos esta sesión.** Todos los tests son unitarios con `PrismaService` mockeado (`jest.fn()` sobre `findUnique`/`create`); no se ejecutó `prisma db push`, `prisma migrate`, ni ninguna query real contra Postgres. La unicidad de `username`/`email` a nivel de constraint de BD (`@unique` en `schema.prisma`, entrada 041) sigue sin verificarse contra datos reales; solo se verificó la lógica de aplicación (use case + repo) contra mocks.
- README.md: fila de `/auth/register` actualizada para mencionar `username`; ejemplo de request body añadido junto a la respuesta `{ "token": "<jwt>" }`.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 043 — back#24 — front#50 — expose username on GET /leaderboard/:levelId

**Fecha:** 2026-07-13
**Tarea o problema abordado:** Fragmento 4/4 (final) de back#24: exponer `username` en la respuesta de `GET /leaderboard/:levelId` sin contaminar el agregado de escritura `ScoreEntry`. Se introduce un read model dedicado (`LeaderboardRow`) siguiendo un enfoque CQRS-lite: la ruta de escritura (`POST /scores` → `ScoreEntry` → `ScoreEntryResponseDto`) queda intacta; la ruta de lectura del ranking gana su propia forma con `username` resuelto.
**Herramienta de IA utilizada:** Claude Code (agent dedicado a Task B4)
**Prompt o instrucción proporcionada:** > "Implementa Task B4 (back#24, cierra front#50): expone username en el leaderboard vía LeaderboardRow read model, siguiendo TDD — spec del use case reescrito primero (RED), luego use case/repo/mapper/controller (GREEN), actualizar los 3 specs restantes que mockean IScoreRepository, tsc + jest en verde, AI_HISTORY + README + commit exacto."
**Resultado obtenido:**
- `src/application/read-models/leaderboard-row.ts` (nuevo): interfaz `LeaderboardRow { id, userId, username, levelId, score, stars, moves, timeSeconds, createdAt }`, comentario inline documentando el patrón CQRS-lite frente al agregado `ScoreEntry`.
- `src/application/ports/i-score.repository.ts`: `findTopByLevel(levelId, limit): Promise<ScoreEntry[]>` reemplazado por `findLeaderboard(levelId, limit): Promise<LeaderboardRow[]>`; `save` sin cambios.
- `src/infrastructure/database/prisma-score.repository.ts`: `findLeaderboard` hace join en dos pasos — (1) top-N `scoreEntry.findMany` por nivel; (2) `user.findMany` por los `userId` distintos del resultado, proyectando solo `id`/`username`; arma las filas con fallback defensivo `player_<primeros 8 chars del userId>` si un score apunta a un usuario inexistente. Se eliminan `ScoreEntryRecord`/`toDomain` (ya sin uso, `save` no los necesitaba).
- `src/application/use-cases/get-leaderboard.use-case.ts`: `execute` ahora devuelve `Promise<LeaderboardRow[]>` y llama a `scoreRepo.findLeaderboard`; `DEFAULT_LIMIT`/`MAX_LIMIT`/`clampLimit` sin cambios.
- `src/adapters/mappers/score.mapper.ts`: nuevo `LeaderboardEntryResponseDto extends ScoreEntryResponseDto { username: string }` + `ScoreMapper.leaderboardRowToDto`. `ScoreEntryResponseDto` y `ScoreMapper.toDto(ScoreEntry)` **sin cambios** (ISP: el DTO de escritura no gana `username`).
- `src/adapters/controllers/score.controller.ts`: `getLeaderboard` devuelve `Promise<LeaderboardEntryResponseDto[]>`, mapea con `ScoreMapper.leaderboardRowToDto`. `submitScore` intacto.
- Specs actualizados: `get-leaderboard.use-case.spec.ts` (reescrito con mock `findLeaderboard`, filas con `username`); `submit-score.use-case.spec.ts` (mock del puerto corregido a `findLeaderboard`, sin cambio de comportamiento); `prisma-score.repository.spec.ts` (`describe('findLeaderboard', ...)` reemplaza `findTopByLevel`, con caso de join exitoso y caso de fallback `player_<8 chars>` cuando el `userId` no tiene usuario asociado); `score.mapper.spec.ts` (nuevo caso `leaderboardRowToDto`, el test de `toDto` queda igual); `score.controller.spec.ts` (`getLeaderboard` mockeado con `LeaderboardRow[]`, aserción incluye `username`).
- TDD verificado: `npx jest src/application/use-cases/get-leaderboard.use-case.spec.ts` en rojo tras reescribir el spec (`TypeError: this.scoreRepo.findTopByLevel is not a function`, 4 tests fallando) porque el use case todavía llamaba al método viejo del puerto; verde tras implementar los pasos 5-8 del brief (use case + repo + mapper + controller).
- Verificación final: `npx jest` → 44 suites / 196 tests, todo verde. `npx tsc --noEmit` → exit 0.
- Lint acotado (`npx eslint <archivos tocados>`, nunca `npm run lint`): un error de formato de `prettier/prettier` en `score.controller.ts` corregido en el propio archivo. Los errores `@typescript-eslint/unbound-method` sobre `expect(mockScoreRepo.X).toHaveBeenCalledWith(...)` en los specs de use case son preexistentes (confirmado corriendo eslint sobre las versiones de `HEAD` vía `git stash`/`git stash pop`) y no fueron introducidos por este fragmento.
- **Verificación honesta — sin base de datos esta sesión.** Todos los tests son unitarios con `PrismaService` mockeado (`jest.fn()` sobre `scoreEntry.findMany`/`user.findMany`); no se ejecutó `prisma db push`, `prisma migrate`, ni ninguna query real contra Postgres. El join `scoreEntry` → `User` y el fallback `player_<8 chars>` solo se verificaron contra mocks, no contra datos reales.
- README.md: fila de `GET /leaderboard/:levelId` y el ejemplo de respuesta actualizados para reflejar el nuevo campo `username` por fila.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 044 — back#24 — fix de revisión: e2e del contrato de error roto por username requerido

**Fecha:** 2026-07-13
**Tarea o problema abordado:** Revisión del PR #25 (ClaudiaLopezp) detectó una regresión enmascarada: tras la fusión con `main`, `test/error-contract.e2e-spec.ts` seguía posteando a `POST /auth/register` con `{ email, password }` sin `username`. Como el nuevo `RegisterDto.username` es requerido y `app.setup.ts` aplica `ValidationPipe({ whitelist, forbidNonWhitelisted })`, la petición devolvía 400 (Bad Request) antes de llegar al caso de uso, pero el test esperaba 409 (email ya registrado) — `E2E: 1 failed, 10 passed`. El CI no lo cachaba porque el workflow corre `test` (Jest unit, `rootDir: src`) y el e2e vive en `test:e2e` (config aparte), fuera del pipeline: el e2e roto pasaba el check verde.
**Herramienta de IA utilizada:** Claude Code (Opus, rol Arquitecto Senior; skill superpowers:receiving-code-review)
**Prompt o instrucción proporcionada:** > "hay una nueva revision del pr#25, se encontro un conflicto, revisalo y arreglalo por favor"
**Resultado obtenido:**
- `test/error-contract.e2e-spec.ts` (test 409): se añade `username: 'taken_user'` al body del `POST /auth/register` (pasa el `ValidationPipe`) y también al `mockResolvedValue` del usuario existente. Este segundo cambio no es solo cosmético: `PrismaUserRepository.findByEmail` reconstruye el `User` vía `toDomain` → `new Username(record.username)`, así que sin `username` en el record el VO se construiría con un valor ausente. Con ambos, el caso de uso alcanza el check de email y lanza `UserAlreadyExistsException` → 409.
- Verificación: `npm run test:e2e` → 3 suites / 11 tests verdes (antes 1 failed). Sin regresión en el resto: `npx tsc --noEmit` exit 0, `npx jest` (unit) 49 suites / 262 tests verdes, `eslint` del archivo tocado limpio.
- **Hueco de CI señalado (no corregido en este fragmento):** `test:e2e` no está en `.github/workflows/ci.yml`, por lo que un e2e roto no bloquea el merge. El e2e usa `PrismaService` mockeado (no necesita Postgres), así que añadirlo al pipeline es viable y cerraría el hueco que permitió que esta regresión pasara verde. Queda como recomendación para un fragmento aparte.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 045 — ci(back): añadir e2e al gate de CI (cierra el hueco de la entrada 044)

**Fecha:** 2026-07-13
**Tarea o problema abordado:** La entrada 044 identificó la causa raíz de que una regresión e2e pasara el gate en verde: `.github/workflows/ci.yml` solo corría `npm test` (Jest unitario, `rootDir: src`), mientras que la suite e2e (`test:e2e`, config `test/jest-e2e.json`) quedaba fuera del pipeline. Añadir el e2e al workflow para que un e2e roto bloquee el merge.
**Herramienta de IA utilizada:** Claude Code (Opus, rol Arquitecto Senior)
**Prompt o instrucción proporcionada:** > "haz ambos" (añadir test:e2e al CI y responder a la reviewer)
**Resultado obtenido:**
- `.github/workflows/ci.yml`: nuevo step `E2E` (`npm run test:e2e`) entre `Test` y `Build`. Usa `PrismaService` mockeado (`test/create-test-app.ts`), así que corre sin Postgres real; la `DATABASE_URL` dummy del job basta y `JWT_SECRET` tiene fallback de test.
- **Nombre del job preservado a propósito** (`lint · test · build`, no `… · e2e · …`): ese string es el nombre del check requerido en la protección de rama de `main`. Renombrarlo dejaría el check requerido como "faltante" y bloquearía todo PR hasta actualizar Settings → Branches. Se documentó la restricción en un comentario del propio workflow.
- Verificación: `npm run test:e2e` local → 3 suites / 11 tests verdes; estructura del workflow validada (pasos `Install → Generate Prisma → Lint → Test → E2E → Build`). El efecto real (bloquear un e2e roto) se confirmará en la corrida de CI del push.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 046 — back#27 — mapear UsernameAlreadyTakenException a 409 (elimina la asimetría 400 vs 409)

**Fecha:** 2026-07-14
**Tarea o problema abordado:** Una revisión de completitud detectó un contrato de error inconsistente: un **email** duplicado en `POST /auth/register` devolvía **409 Conflict**, pero un **username** duplicado devolvía **400 Bad Request**. `UsernameAlreadyTakenException` no estaba en el registro `statusByException` de `DomainExceptionFilter`, así que caía al default 400, mientras que `UserAlreadyExistsException` sí mapeaba a 409. Dos conflictos de "ya tomado" equivalentes salían con códigos distintos.
**Herramienta de IA utilizada:** Claude Code (Opus, rol Arquitecto Senior; skill arrowmaze-backend, TDD rojo→verde)
**Prompt o instrucción proporcionada:** > "hagamos ambas cosas a y b" (a = arreglar la asimetría 400/409 del username)
**Resultado obtenido:**
- `src/shared/aspects/domain-exception.filter.ts`: nueva entrada `[UsernameAlreadyTakenException, HttpStatus.CONFLICT]` en el registro (más su import). Aprovecha el diseño OCP del filtro — se extiende añadiendo una fila, sin tocar el flujo de `catch`. El `code` estable derivado es `USERNAME_ALREADY_TAKEN`.
- `src/adapters/controllers/auth.controller.ts`: la `@ApiResponse({ status: 409 })` de `register` pasa de `'Email already registered.'` a `'Email already registered, or username already taken.'` para documentar ambos conflictos.
- `src/shared/aspects/domain-exception.filter.spec.ts`: nuevo caso AAA que mapea `UsernameAlreadyTakenException` → 409 con cuerpo `{statusCode:409, code:'USERNAME_ALREADY_TAKEN', message}`, espejo del test de `UserAlreadyExistsException`.
- TDD: el test corrió en **rojo** antes del fix (`expect(mockStatus).toHaveBeenCalledWith(409)` recibía 400, confirmando el fallback); **verde** tras añadir la entrada al registro.
- Verificación: `npx jest src/shared/aspects/domain-exception.filter.spec.ts` → 7/7; suite completa `npx jest` → **263 tests** verdes (+1); `npx tsc --noEmit` exit 0; `npx eslint` de los archivos tocados limpio; `npm run build` exit 0. Sin BD esta sesión: el mapeo es lógica de aplicación pura (filtro AOP), verificado unitariamente contra el `ArgumentsHost` mockeado.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 047 — feat(back): soporte Docker para desarrollo local

**Fecha:** 2026-07-14
**Tarea o problema abordado:** El usuario pidió correr todo el proyecto (back + front) en Docker para desarrollo local, sin instalar Node/PostgreSQL en el host. Este fragmento cubre el lado backend: imagen Docker de desarrollo que aplica migraciones y siembra los niveles curados automáticamente al arrancar.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5, rol Arquitecto de Software Senior; skills superpowers:brainstorming + superpowers:writing-plans)
**Prompt o instrucción proporcionada:** > "Necesito que configures todo el proyecto para back y front corran en docker"
**Resultado obtenido:**
- `Dockerfile` (nuevo): imagen de desarrollo `node:22-alpine` — `npm ci`, entrypoint dedicado. Deliberadamente sin `prisma generate` en build time: `prisma.config.ts` exige `DATABASE_URL` para cargarse y esa variable no existe en build time; el entrypoint ya lo corre en cada arranque con la `DATABASE_URL` real. No es multi-stage ni apta para producción a propósito (fuera de alcance, ver spec en `docs/superpowers/specs/2026-07-14-docker-local-dev-design.md` de la raíz del proyecto).
- `docker-entrypoint.sh` (nuevo): en cada arranque del contenedor corre `prisma generate` → `prisma migrate deploy` → `prisma db seed` (idempotente, `upsert` por id) → `exec "$@"` (delega al `CMD`, `npm run start:dev`).
- `.gitattributes` (nuevo): fuerza `eol=lf` en `docker-entrypoint.sh` — con `core.autocrlf=true` en Windows, un checkout con CRLF rompería `#!/bin/sh` dentro del contenedor Linux.
- `.dockerignore` (nuevo): excluye `node_modules`, `dist`, `.git`, `.env`, `coverage`.
- La orquestación completa (compose, Postgres, frontend) vive en `ArrowMaze/docker-compose.yml`, fuera de este repo (esa carpeta raíz no es un repositorio git) — documentada en `ArrowMaze/README-docker.md`.
- Verificación: `docker build -t maze-back:dev -f Dockerfile .` exitoso; `sh -n docker-entrypoint.sh` sin errores de sintaxis. La verificación end-to-end (migración + seed reales + `GET /levels`) se hizo en el fragmento de integración del stack completo.
- README.md: nueva sub-sección "Docker (recommended for local dev)" bajo "Getting Started".
- Nota de numeración: esta entrada y la siguiente se escribieron originalmente como 046/047 en la rama `feat/docker-local-dev`; se renumeraron a 047/048 al integrar `main`, que ya había tomado el número 046 (fix del 409 de username).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 048 — fix(back): agregar la migración inicial de Prisma faltante

**Fecha:** 2026-07-14
**Tarea o problema abordado:** La verificación end-to-end del stack Docker (entrada 047) reveló que `prisma/migrations/` nunca existió en este repo — nadie había commiteado la migración inicial. `docker-entrypoint.sh` corre `prisma migrate deploy` (correcto para un entorno no interactivo), pero sin ninguna migración que aplicar, la tabla `Level` nunca se creaba en una base de datos nueva y el seed fallaba con `P2021: The table 'public.Level' does not exist`. No es un bug del Dockerfile: cualquier base de datos Postgres fresca (CI, despliegue, o este contenedor) tendría el mismo problema, porque el proyecto venía dependiendo de que cada developer ya tuviera el schema aplicado localmente (vía `prisma db push` o un `migrate dev` nunca commiteado).
**Herramienta de IA utilizada:** Claude Code (Sonnet 5, rol Arquitecto de Software Senior)
**Prompt o instrucción proporcionada:** > "Generar y commitear la migración inicial" (elegido por el usuario entre dos opciones tras encontrar el bloqueo durante la verificación end-to-end del plan de Docker)
**Resultado obtenido:**
- `prisma/migrations/20260714134255_init/migration.sql` (nuevo): generado con `prisma migrate dev --name init --skip-seed` corrido dentro del contenedor `back` (`docker compose run --rm --entrypoint "" back sh -c "npx prisma migrate dev --name init --skip-seed"`, contra la base `db` de Docker, ya vacía) — captura el schema completo actual (`Level`, `User`, `ScoreEntry`, `Progress` con sus índices y unique constraints) como el estado base.
- `prisma/migrations/migration_lock.toml` (nuevo): generado junto con la migración, fija el provider (`postgresql`).
- Verificación: tras generar la migración, se relanzó el stack completo (`docker compose up -d`); `docker compose logs back` mostró `Applying database migrations` → `20260714134255_init` aplicada → seed de los 15 niveles curados exitoso; `GET /levels` devolvió los 15 `levelId` esperados. Detalle completo en la entrada de integración del stack completo.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 049 — fix(api): habilitar CORS para clientes de navegador (front web dockerizado)

**Fecha:** 2026-07-14
**Tarea o problema abordado:** La revisión pre-merge del PR #29 detectó que la API no emitía ninguna cabecera CORS (ningún `enableCors` en `src/`). El front web dockerizado (entrada 047 + front PR #62) corre en el navegador del host en `localhost:8080` y llama a la API en `localhost:3000` — cross-origin: el navegador bloqueaba toda petición (login, niveles, leaderboard) aunque `curl` funcionara, por lo que la verificación en vivo original no lo detectó (solo usó curl + page-load).
**Herramienta de IA utilizada:** Claude Code (Fable 5, rol Arquitecto de Software Senior; skill arrowmaze-code-reviewer)
**Prompt o instrucción proporcionada:** > "Modifica todo lo que creas que merece ser modificado y resuelve los pr" (tras el informe de revisión que reportó el hallazgo)
**Resultado obtenido:**
- `src/app.setup.ts`: `app.enableCors()` en `configureApp` (compartido main.ts ↔ e2e, así el fix aplica a ambas superficies). Origen `*` justificado inline: el JWT viaja por header `Authorization`, nunca cookies, así que el origen abierto no habilita CSRF.
- `test/cors.e2e-spec.ts` (nuevo): 2 casos AAA sobre la infra e2e existente (Prisma mockeado) — `GET /levels` con `Origin` cross-origin devuelve `Access-Control-Allow-Origin: *`, y el preflight `OPTIONS` responde 204 permitiendo el método solicitado.
- README.md: la sección Docker menciona que la API sirve CORS para el front web; corregida además la línea de `npm run test:e2e` que aún decía "no DB-backed e2e specs yet" (hay 4 specs e2e desde back#3).
- Verificación: `npm run test:e2e` → 4 suites / 13 tests verdes (antes 3/11); `npx eslint` de los 2 archivos tocados limpio; `npx tsc --noEmit` exit 0.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 050 — chore(prisma): declarar dotenv explícito y documentar el baselining de migraciones

**Fecha:** 2026-07-14
**Tarea o problema abordado:** Dos hallazgos menores de la misma revisión pre-merge del PR #29, ambos alrededor del wiring de Prisma: (1) `prisma.config.ts` importa `dotenv/config` pero `package.json` no declaraba `dotenv` — dependencia fantasma que resolvía solo por hoisting de `@nestjs/config`/`prisma` (funciona reproduciblemente con `npm ci`, pero se rompería si esos paquetes dejaran de traerla); (2) con la migración inicial ya commiteada (entrada 048), cualquier base de datos local pre-existente creada con `prisma db push` no tiene tabla `_prisma_migrations`, y `migrate dev`/`migrate deploy` contra ella intentará recrear tablas que ya existen.
**Herramienta de IA utilizada:** Claude Code (Fable 5, rol Arquitecto de Software Senior; skill arrowmaze-code-reviewer)
**Prompt o instrucción proporcionada:** > "Modifica todo lo que creas que merece ser modificado y resuelve los pr"
**Resultado obtenido:**
- `package.json` + `package-lock.json`: `dotenv@^17.4.2` como devDependency explícita (misma major que ya traía `@nestjs/config`).
- README.md (§ Install and run): nota de baselining único para bases `db push` pre-existentes — `npx prisma migrate resolve --applied 20260714134255_init`. De paso, § Running Tests actualiza el conteo de unit tests (219 → 263, estaba desactualizado desde back#24).
- No se tocó `prisma/seed.ts`: la revisión anotó como SUGGESTION que un futuro reordenamiento de niveles curados (intercambiar `order` entre ids existentes) podría chocar con el unique `Level_order_key` a mitad del loop de upserts; se deja documentado y no se implementa porque un `$transaction` no lo resolvería (Postgres valida uniques por sentencia, no al commit, salvo constraints DEFERRABLE) y el fix real (update en dos fases) es YAGNI con los 15 niveles estables.
- Verificación: `npm test` y `npm run build` verdes tras el `npm install` (ver corrida en el commit).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 051 — Glosario: Grafo de bloqueos, Sección, Nivel temático, Instrucciones de pintado

**Fecha:** 2026-07-14
**Tarea o problema abordado:** Registrar en el glosario los términos acordados en la sesión de revisión de arquitectura + grilling (candidatos C1–C5): el Grafo de bloqueos (modelo conceptual de la solubilidad: nodo = Arrow, arista Y→X cuando Y ocupa el carril de salida de X; Solución = orden de pelado determinista), la Sección del catálogo (campaña | temático), el Nivel temático y las Instrucciones de pintado (metadata visual opaca: paleta de roles + rol por flecha). Respaldado por ADR 0003 y ADR 0004 (docs/adr/ del workspace).
**Herramienta de IA utilizada:** Claude Code (Fable 5) — skills /improve-codebase-architecture, /grill-with-docs (/grilling + /domain-modeling), /codebase-design
**Prompt o instrucción proporcionada:** > "Quiero que veamos la resolución del tablero como grafos… el último nivel sea un tablero de 50x50… tiene que haber un apartado temático donde hayan por lo menos 3 seeds personalizadas con figuras…"
**Resultado obtenido:** CONTEXT.md ampliado con 4 términos; issues back#30–#32 triageados con Agent Briefs (más front#64–#69).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 052 — LevelSolver sobre grafo de bloqueos (back#30)

**Fecha:** 2026-07-14
**Tarea o problema abordado:** El replay greedy de `LevelSolver` reconstruía el `Set` de ocupación en cada `canExit` y reiniciaba el escaneo tras cada remoción (~O(A³)); inviable para la campaña 50×50 con ~300–400 flechas (ADR 0003). Se reimplementó sobre el Grafo de bloqueos (CONTEXT.md): mapa de ocupación celda→flecha construido una vez, arista Y→X cuando Y ocupa el carril de salida de X, y pelado tipo Kahn con min-heap por índice congelado en `level.arrows` — equivalente byte-a-byte al greedy previo (ADR 0002 dec. 5). Interface pública intacta (`solve`/`isSolvable`); el residuo no pelable queda como diagnóstico privado (`peel`), no expuesto.
**Herramienta de IA utilizada:** Claude Code (Fable 5)
**Prompt o instrucción proporcionada:** > "Implement GitHub issue DanCas03/MazePruebaBack#30 end-to-end: LevelSolver sobre grafo de bloqueos, Soluciones byte-idénticas (snapshot de los 15 fixtures antes del refactor), test de escala 50×50 con ≥300 flechas < 250 ms, dominio puro sin dependencias nuevas."
**Resultado obtenido:** Snapshot congelado `src/domain/services/curated-solutions.snapshot.json` (capturado con la implementación pre-refactor y verificado byte-idéntico tras el refactor); `level-solver.ts` reescrito (grafo + `MinIndexHeap` privado del módulo); tests AAA añadidos a `level-solver.spec.ts`: equivalencia de los 15 fixtures contra el snapshot, determinismo en llamadas repetidas, residuo interno con ambas flechas de un ciclo de 2, escala 50×50/325 flechas < 250 ms. Suite completa: 49 suites / 282 tests unit + 4 suites / 13 tests e2e en verde sin tocar los tests existentes.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 053 — feat(levels): Sección e Instrucciones de pintado en el wire (back#31, ADR 0004)

**Fecha:** 2026-07-14
**Tarea o problema abordado:** Implementar el wire temático de ADR 0004: los Niveles temáticos son `Level` reales en una Sección aparte del catálogo y las Instrucciones de pintado (paleta de roles + rol por flecha) viajan como datos opacos. Schema: `order Int? @unique` (nullable, temáticos sin orden) + `section String @default("campaign")`, con su migración Prisma `..._themed_section_paint` (el repo lleva historial de migraciones desde back#29; `docker-entrypoint.sh` aplica `migrate deploy`). Dominio: `Level` gana `section` y un portador opaco `paint?: LevelPaint` — decisión: en la entidad (no tuplado en el repo) para que `LevelMapper` reciba un solo objeto; sin comportamiento ni validación, `LevelSolver` lo ignora. Wire: `LevelSummaryDto.section`, `LevelDto.palette?` y `paintRole?` por flecha (passthrough puro; claves omitidas en campaña → wire pre-#31 idéntico byte a byte). Seed: carga `t-*.json`, upsert de order/section, y `validateLevelPaint` (chequeo barato fail-fast: todo `paintRole` existe en `palette`, hex `#RRGGBB`) — única validación de la metadata en todo el back. Fixture smoke `t-smoke` (6×6, roles cara/ojo) para ejercitar el pipe end-to-end hasta que lleguen las figuras reales (front#68).
**Herramienta de IA utilizada:** Claude Code (Fable 5)
**Prompt o instrucción proporcionada:** > "Implement GitHub issue DanCas03/MazePruebaBack#31 end-to-end on its own branch and open its PR… GET /levels → each item gains section… GET /levels/:id themed → carries palette and each arrow gains paintRole… the paint metadata is opaque."
**Resultado obtenido:** 6 commits en `feat/#31-themed-section-paint-wire`: schema (section + order nullable), dominio (LevelSection/LevelPaint + withSection/withPaint con fallback campaign), infraestructura (toDomain iza palette/paintRole al portador; catálogo `order asc nulls last, id asc`), API (DTOs + Swagger), seed (validateLevelPaint + t-smoke + manifest), e2e temático (catálogo con secciones sobre los 15 fixtures reales legacy, round-trip de pintado, solution del temático). Tests: 285 unit + 18 e2e verdes sin BD. `prisma db push` NO ejecutado: Postgres/Docker abajo en la sesión.
**Modificaciones realizadas por el equipo:** Auditoría (Claude Code, Opus 4.8): el PR original NO commiteaba la migración del cambio de schema, solo `db push` — en el flujo real (`docker-entrypoint.sh` → `migrate deploy` + `db seed`) la tabla `Level` quedaba sin `section` y con `order NOT NULL`, y el Prisma Client (generado del schema, que sí trae `section`) rompía toda query de niveles y el seed con `P2022`. CI no lo detectaba porque el e2e mockea `PrismaService`. Fix: se agrega la migración `..._themed_section_paint` (`ALTER TABLE "Level" ADD COLUMN "section" ... DEFAULT 'campaign'`, `ALTER COLUMN "order" DROP NOT NULL`), generada offline con `prisma migrate diff` schema-a-schema. Nit corregido: `validateLevelPaint` usaba `paintRole in palette` (recorre la cadena de prototipos) → `Object.prototype.hasOwnProperty.call`.

## Entrada 054 — Sesión C2 (front#69): diseño BoardSpace / 3D-readiness

**Fecha:** 2026-07-14
**Tarea o problema abordado:** Grilling del candidato C2 (reservado en MazePruebaFront#69): la aritmética 2D está fugada en los call sites del back (`exitPath` privado del solver clon del front, adyacencia `dr+dc===1` en `arrow.entity`, in-bounds en `level.entity`) y una variación del espacio (3D como estresor de examen) sería transversal. Definir la estructura mínima que la haga barata sin código especulativo.
**Herramienta de IA utilizada:** Claude Code (Fable 5) — /improve-codebase-architecture → /grill-with-docs (/grilling + /domain-modeling + /codebase-design)
**Prompt o instrucción proporcionada:** > "trae el issue #69 del front y vamos a definir como se va a estructurar el problema… el sistema debe ser lo suficientemente desacoplable que si se quiere agregar la funcionalidad de hacer un tablero 3D debe ser posible… no debe ser el único caso…"
**Resultado obtenido:** Decisiones D1–D5 registradas en ADR-0005 (workspace `docs/adr/`): módulo profundo **BoardSpace** en `src/domain` con seam real (clase abstracta + `RectSpace` de producción + `HoledRectSpace` de certificación solo-tests); `Direction` queda enum cerrado sin vector; `Level` sostiene el espacio y absorbe la validación de adyacencia (sale de `Arrow`); el solver usa `space.exitLane` (muere su `exitPath` privado) con el Grafo de bloqueos intacto (C1/ADR-0002); mapper/factory conservan el wire intacto. Implementación diferida tras el batch (D5): issue #36 (bloqueado por #32); espejo front en MazePruebaFront#73. Glosario: nuevo término **BoardSpace (Espacio del tablero)**.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 055 — feat(levels): re-siembra de campaña con rampa agresiva hasta 50×50 (back#32, ADR 0003)

**Fecha:** 2026-07-15
**Tarea o problema abordado:** Re-producir en pleno los 15 fixtures de campaña con la rampa de ADR 0003 (decisión C3 del grilling 2026-07-14): estructura 15 = 5 tiers × 3 intacta, saltos no proporcionales, densidad creciente, `timeLimitSec` derivado de la carga de flechas pedida por el escalón de la rampa (`arrowCount × 4`, ceil al múltiplo de 30) en los tiers cronometrados (7–15), y nivel 15 = 50×50. Los candidatos vienen del CLI de producción del front (`MazePruebaFront/tool/level_production`, front#65) y una **Curación** humana elige los 15 finales. Bloqueado por back#30 (solver sobre grafo — rendimiento a escala) y front#65 (candidatos) + curación: ambos ya cerrados, pero el lote de candidatos no estaba producido ni curado.
**Herramienta de IA utilizada:** Claude Code (Opus 4.8)
**Prompt o instrucción proporcionada:** > "Vamos a tomar el issue #32 del back y vamos a resolverlo hasta su completitud."
**Resultado obtenido:** (1) **Producción**: se corrió el CLI del front (`produce.dart`) sobre los 6 escalones de la rampa (T1 6×8 → T2 10×12 → T3 18×20 → T4 30×34 → T5 42×46 → remate 50×50), 6 semillas por escalón; todos válidos/solubles por construcción. El remate 50×50 degrada con gracia (la caminata auto-evitante satura: ~185/232 flechas en las primeras semillas). (2) **Curación** (usuario, 2026-07-15): recomendado con semilla-más-baja en los tiers uniformes T1–T4 y mejor-relleno en T5; para el nivel 15 se pidió "el más complicado pero bien hecho" → búsqueda ampliada de semillas del remate → `cand-t5-s918` (216/232 flechas, densidad 0.51, el 50×50 más denso y bien formado). Rampa de flechas 6→13→36→94→163→166→216. (3) **Reemplazo**: los 15 `prisma/levels/level-01..15.json` re-generados (remapeando `levelId`→`level-NN`, `order`→1..15) en el estilo compacto del repo (celdas `[r, c]` en línea). Provenance reproducible por tier+seed en `manifest.md` (sin congelar candidatos en el back: el CLI + semilla los reproduce byte a byte). (4) **Spec** (delegado a subagente QA): `curated-levels.spec.ts` — bandas de dimensiones 5→6 (el tier 5 abre dos: 42×46 + remate 50×50), política de tiempo nueva (órdenes 1–6 sin límite; 7–15 entero > 0, ≥ 30, múltiplo de 30, dropeados los 120/180 fijos), timers no decrecientes, y presupuesto de tiempo del seed (build+solve del lote < 10 s sin BD). (5) **Snapshot** del solver: `curated-solutions.snapshot.json` re-capturado sobre los nuevos fixtures — la caracterización de back#30 lee los fixtures vivos por diseño (su test de escala ya anticipaba "la campaña re-producida de ADR 0003"); el freeze se re-escopó en el comentario: se re-captura al re-producir la campaña a propósito, nunca para tapar un cambio de solver. **Verificación**: seed real sobre un Postgres desechable (Docker :55432) en **3.58 s** con los 16 niveles (15 campaña + t-smoke) incl. el 50×50 (AC < 10 s ✔); `LevelSolver.solve` sobre el nivel 15 (216 flechas) en **0.24 ms**, solución de 216 (AC endpoint < 500 ms ✔, dominado por auth+fetch, no por el solver); suite unit **51/318 verde**, e2e **5/18 verde**, `curated-levels` **41 verde**; lint limpio en los specs tocados. README §Seeding levels actualizado con la rampa (6×8 → remate 50×50).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 056 — feat(levels): sembrar la Sección temática con 3 figuras (corazón, cara feliz, conejo) — reemplaza t-smoke (back#41, front#68)

**Fecha:** 2026-07-15
**Tarea o problema abordado:** Aterrizar en el seed de la Sección temática los 3 fixtures producidos por el tooling del front (front#68, ADR 0004 dec. 4: mínimo 3 figuras), reemplazando el placeholder `t-smoke`. El back guarda/sirve las Instrucciones de pintado (`palette` + `paintRole`) como datos opacos; la única validación es el chequeo de forma (`validateLevelPaint`) y la solubilidad (`LevelSolver`).
**Herramienta de IA utilizada:** Claude Code (Opus 4.8)
**Prompt o instrucción proporcionada:** > "revisa si ya se puede hacer el issue front#68 [...] empecemos front#68 [...] Front PR + back PR ahora."
**Resultado obtenido:**
- `prisma/levels/t-heart.json` (16×14, 23 flechas, rol `heart`), `t-happy-face.json` (16×16, 38 flechas, roles `face`/`features`), `t-bunny.json` (16×20, 37 flechas, roles `fur`/`pink`/`eye`): fixtures temáticos (`section: "themed"`, sin `order`, sin `timeLimitSec` — temático v1 sin reloj), con `palette` de roles→hex y `paintRole` por flecha. Transformados 1:1 desde los fixtures congelados del front (`tool/level_production/themed/themed-*.json`), renombrando `levelId`→`t-*` (guion, patrón `t-[a-z0-9-]+`) e izando `section` a raíz como espera `prisma/seed.ts`.
- Borrado `prisma/levels/t-smoke.json`.
- `curated-levels.spec.ts`: el test específico de t-smoke se reemplazó por uno del nuevo set (ids `t-bunny`/`t-happy-face`/`t-heart`, todos `section: themed`, sin `order` ni `timeLimitSec`); el `it.each` de solubilidad + `validateLevelPaint` ya cubre los 3 automáticamente.
- `test/levels-themed.e2e-spec.ts`: solo comentario — el fixture in-memory (Prisma mockeado) deja de anunciarse como "espejo de t-smoke.json" y se describe como temático sintético representativo, desacoplado del contenido real del seed.
- `prisma/levels/manifest.md`: procedencia de las 3 figuras (máscara + seed + cobertura) y nota del reemplazo de t-smoke.
- **Verificación (lo efectivamente corrido aquí):** `npx jest curated-levels` → **44/44 verde** — re-certificación cruzada: el `LevelSolver` del back construye y prueba soluble cada uno de los 3 fixtures y pasan el paint check. Suite unitaria completa `npx jest` → **321/321 verde, 51 suites**. `npx eslint` acotado a los 2 `.ts` tocados → 0 issues. **Pendiente (no corrido en este entorno):** el seed real contra Postgres y la suite e2e (`test/*.e2e-spec.ts`) corren en Docker — no ejecutados aquí; el e2e temático es self-contained (DB mockeada) y no depende del archivo borrado.
## Entrada 056 — Golden-master del LevelSolver desacoplado de prisma/levels (back#39)

**Fecha:** 2026-07-15
**Tarea o problema abordado:** La caracterización golden-master de `LevelSolver` (back#30) leía los fixtures VIVOS de campaña `prisma/levels/*.json` vía `fs.readdirSync` y comparaba contra `curated-solutions.snapshot.json`, así que cada resembrado de la campaña obligaba a recapturar el snapshot — el "congelado" no lo estaba. Lo señaló la revisión adversarial de PR #38 (back#32, resembrado 50×50, en vuelo); el equipo eligió "mergear #32 + issue de seguimiento #39". back#39 le da a la caracterización su propio set de fixtures ESTÁTICO y congelado, independiente de `prisma/levels/`, para que la golden-master vuelva a estar realmente congelada.
**Herramienta de IA utilizada:** Claude Code (Opus 4.8) — skills arrowmaze-backend / arrowmaze-qa; workflow de revisión adversarial multi-agente (9 agentes, 4 lentes) para auditar el diff antes del PR.
**Prompt o instrucción proporcionada:** > "Lee [HANDOFF-back39-decouple-characterization.md] y realiza el issue 39 del back"
**Resultado obtenido:** Nuevo contrato estático coubicado con el spec: `src/domain/services/characterization-fixtures.json` (4 niveles sintéticos — `char-01-clear-lanes` carriles independientes con orden = índice; `char-02-order-dependent` orden de remoción ≠ índice; `char-03-mixed-directions` las 4 direcciones + serpiente doblada + cadena de bloqueo con arista vertical `arrow-2→arrow-4→arrow-3`; `char-04-dense-pack` 10×10/50 flechas empaquetadas alternando dirección por fila) + `characterization-solutions.snapshot.json` capturado UNA vez del solver actual mediante un generador ts-jest desechable (borrado). Reescrito el bloque `golden-master characterization` en `level-solver.spec.ts`: lee los dos JSON por `__dirname` (no `cwd`), sin `readdirSync('prisma/levels')`; eliminado el snapshot viejo `curated-solutions.snapshot.json` (ya sin referencias). Sin cambio de comportamiento ni de superficie pública (README intacto); los tests legítimamente acoplados a `prisma/levels` (`curated-levels.spec.ts`, `seed.ts`, e2e temático) quedan intactos. La revisión adversarial confirmó 1 hallazgo (procedencia): el comentario/título heredaba el lenguaje "byte-idéntico al replay greedy previo" — falso para fixtures nuevos que nunca corrieron el solver pre-refactor; corregido a "guarda de regresión hacia delante sobre la Solución canónica del solver actual" (sigue apoyándose en el determinismo de ADR 0002 dec. 5). Los otros 4 hallazgos se descartaron tras verificación adversarial. Suite completa: 51 suites / 308 tests unit + 5 suites / 18 tests e2e en verde tras rebasar sobre back#32 (la re-siembra 50×50 no afecta esta golden-master — que sigue en 19/19 sobre sus 4 fixtures sintéticos —, que es justo el objetivo de #39); eslint limpio en el spec tocado. (Numeración: entrada 056, tras la 055 = back#32 / PR #38, ya en `main`.)
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 057 — feat(auth): endpoint GET /auth/me con el perfil del usuario autenticado (back#44)

**Fecha:** 2026-07-15
**Tarea o problema abordado:** El JWT que firman login/register solo transporta `{ sub, email }` y no existía forma de resolver el `username` del usuario autenticado — el front (MazePruebaFront#78, panel de cuenta + cierre de sesión en la pantalla de inicio) lo necesita, especialmente tras el auto-login (restauración de sesión), donde solo se tiene el token. back#44 añade un endpoint protegido `GET /auth/me` que devuelve el perfil básico (`id`, `username`, `email`).
**Herramienta de IA utilizada:** Claude Code (Opus 4.8) — skill arrowmaze-backend; TDD (spec-first) por unidad.
**Prompt o instrucción proporcionada:** > "quiero crear un issue para agregarle un boton en el inicio del juego para poder ver los datos basicos del usuario y poder cerrar su sesion… [luego] arranca con la implementacion"
**Resultado obtenido:** Clean Architecture estricta por capas: (1) **domain** — nueva `UserNotFoundException` (se lanza si un token válido apunta a un usuario inexistente, p.ej. cuenta eliminada). (2) **application** — puerto `IUserRepository` extendido con `findById(id: UserId)`; caso de uso `GetCurrentUserUseCase` (Command) que resuelve el `userId` del JWT contra el repo y lanza `UserNotFoundException` si no existe. (3) **adapters** — `UserProfileMapper.toDto(user)` → `{ id, username, email }` (decide explícitamente qué cruza la frontera HTTP; NO expone el hash de contraseña); `AuthController.me()` con `@Get('me')` + `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`, leyendo `req.user.userId`; `GetCurrentUserUseCase` cableado en `AuthModule` (useFactory, DIP). (4) **infrastructure** — `PrismaUserRepository.findById`. (5) **AOP** — `DomainExceptionFilter` mapea `UserNotFoundException` → 404 (código estable `USER_NOT_FOUND`); el 401 del guard conserva la forma estándar de Nest (NO el contrato de dominio), consistente con `/scores` y `/progress`. **Tests (AAA):** `get-current-user.use-case.spec.ts` (devuelve el user / lanza `UserNotFoundException`), `user-profile.mapper.spec.ts` (mapea el DTO y no filtra el hash), y e2e `auth-me.e2e-spec.ts` sobre el stack HTTP real con Prisma mockeado y JWT firmado con el `JwtService` de la app (200 con el perfil, 401 sin token, 404 con el cuerpo uniforme cuando el usuario no existe). Los mocks de `IUserRepository` en los specs de login/register se completaron con `findById`; `openapi.e2e-spec.ts` asevera ahora `/auth/me` en el documento. **Verificación (corrida aquí):** `nest build` limpio; suite unitaria completa **314/314 verde (53 suites)**; suite e2e completa **21/21 verde (6 suites)**. README §API Endpoints actualizado con la fila `GET /auth/me` y ejemplo de respuesta. Dependencia del front (MazePruebaFront#78) desbloqueada para el campo `username`. Progreso/estrellas quedan front-side (fuera de alcance de este endpoint).
## Entrada 057 — feat(domain): módulo space — BoardSpace + RectSpace (back#36, ADR 0005, fragmento 1/6)

**Fecha:** 2026-07-15
**Tarea o problema abordado:** back#36 (candidato C2, ADR-0005): la 2D-idad del tablero está fugada por el dominio — switch dirección→delta en el solver, adyacencia ortogonal `dr+dc===1` en `Arrow`, in-bounds en `Level`. Fragmento 1/6: nace el módulo profundo `src/domain/space/` que concentra TODA la geometría del espacio del tablero (término **BoardSpace** del glosario `CONTEXT.md`).
**Herramienta de IA utilizada:** Claude Code (Fable 5) — skills arrowmaze-backend / arrowmaze-qa; escritura de tests delegada a subagente QA (patrón AAA).
**Prompt o instrucción proporcionada:** > "ejecuta este handoff" (HANDOFF back#36 BoardSpace, scratchpad 2026-07-15; Agent Brief en el issue #36)
**Resultado obtenido:** `board-space.ts`: clase abstracta con `step` como única primitiva geométrica y template methods (GoF) `areAdjacent` (∃ d: step(a,d) = b) y `exitLane` (step* hasta null; EXCLUYE la cabeza; orden cercano→frontera) derivados de ella — un espacio nuevo solo redefine "dar un paso". `rect-space.ts`: `RectSpace(cols, rows)`, única implementación de producción, contiene el ÚNICO switch dirección→delta del artefacto (dentro de `step`, guardado por `contains` en ambos extremos; la frontera devuelve `null`, jamás excepción como control de flujo); `allCells` itera el bounding box filtrando por `contains`, de modo que una subclase que restrinja `contains` herede `allCells`/`cellCount` coherentes sin sobreescribir nada más (prepara el adapter de certificación del fragmento 2). `invalid-board-space.exception.ts`: invariante de dimensiones (enteros ≥ 1) se mudará aquí desde `Level`; code derivado `INVALID_BOARD_SPACE`, cae al 400 default del filtro AOP sin tocar su registro. Interfaz espejo de la Dart pinneada en ADR-0005 (D1–D4): `Direction` sigue enum cerrado de 4 valores sin vector; `Position` 2D intacta. Tests (subagente QA): `rect-space.spec.ts`, 27 tests AAA verdes — constructor (6), directions (1), contains (4), step (3: vecinas, null por cada borde, null desde fuera), areAdjacent (6), exitLane (5: 4 direcciones + cabeza en frontera ⇒ []), allCells/cellCount (2, enumeración row-major). eslint limpio. Ningún consumidor migrado aún (fragmentos 3–4).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 058 — test(domain): HoledRectSpace + contract-test compartido de BoardSpace (back#36, fragmento 2/6)

**Fecha:** 2026-07-15
**Tarea o problema abordado:** ADR-0005 exige un seam REAL: un adapter es un seam hipotético; dos, uno real — pero sin código dormido en producción. Fragmento 2/6: el segundo adapter de certificación `HoledRectSpace` y el contract-test compartido que corre las mismas leyes contra ambos espacios.
**Herramienta de IA utilizada:** Claude Code (Fable 5) — skills arrowmaze-backend / arrowmaze-qa; escritura de tests delegada a subagente QA (patrón AAA).
**Prompt o instrucción proporcionada:** > "ejecuta este handoff" (HANDOFF back#36 BoardSpace, scratchpad 2026-07-15)
**Resultado obtenido:** `src/domain/space/testing/holed-rect-space.ts`: extiende `RectSpace` sobreescribiendo ÚNICAMENTE `contains` (set de agujeros) — `step`/`areAdjacent`/`exitLane`/`allCells`/`cellCount` heredan coherentes porque todo deriva de `step` y `allCells` filtra por `contains`; el agujero es FRONTERA (el carril termina en él). Vive solo en tests: `tsconfig.build.json` añade `**/testing/**` al exclude y se verificó con `nest build` que `dist/` no contiene la carpeta (0 archivos) mientras `board-space`/`rect-space` sí compilan. `board-space.contract.spec.ts` (subagente QA): Parte A — `describe.each` con instancias reales de `RectSpace(4,3)` y `HoledRectSpace(4,3,[(1,2)])`, 8 leyes × 2 espacios = 16 tests (step cerrado en el espacio; step desde fuera ⇒ null; coherencia simétrica step↔areAdjacent; sin autoadyacencia; exitLane excluye la cabeza; exitLane encadena por step hasta la frontera; allCells ⊆ espacio y cellCount coherente; bounding box no excedido). Parte B — 11 tests concretos "el agujero es frontera": step hacia/desde el agujero ⇒ null por ambos lados, carril que termina ANTES del agujero `[(1,1)]`, lanes vacías pegadas al agujero (horizontal y vertical), no-adyacencia con el agujero, enumeración de 11 celdas sin el agujero, contraste 3-vs-1 celdas con RectSpace en la misma llamada, e invariante de dimensiones heredada (`InvalidBoardSpaceException`). Run módulo space: 54/54 verdes (los 27 de rect-space.spec intactos); eslint limpio. BoardSpace NO se mockea en ningún test (valor puro de dominio, decisión del brief).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 059 — refactor(domain): Level sostiene el espacio; la validación geométrica se muda a BoardSpace (back#36, fragmento 3/6)

**Fecha:** 2026-07-15
**Tarea o problema abordado:** ADR-0005 D4/D6: los agregados sostienen el espacio y `Arrow` pasa a ser dato puro. Antes: adyacencia ortogonal `dr+dc===1` inline en `Arrow`, in-bounds `cell.row >= rows` inline en `Level`, dimensiones validadas en `Level` — tres fugas de 2D-idad en las entidades.
**Herramienta de IA utilizada:** Claude Code (Fable 5) — skills arrowmaze-backend / arrowmaze-qa; ajuste de specs delegado a subagente QA (patrón AAA).
**Prompt o instrucción proporcionada:** > "ejecuta este handoff" (HANDOFF back#36 BoardSpace, scratchpad 2026-07-15)
**Resultado obtenido:** `Level` firma nueva: `new Level(id, space: BoardSpace, arrows, timeLimitSec?, section?, paint?)` — acepta CUALQUIER BoardSpace (lo exige la certificación del fragmento 5) y valida a través de él: in-space (`space.contains`), solapamiento, y la adyacencia del camino de cada flecha (`space.areAdjacent`, mudada desde `Arrow`); todo `InvalidLevelException`. `cols`/`rows` siguen expuestos para el wire como campos readonly DERIVADOS del bounding box de `space.allCells()` en construcción ("campos coherentes con el espacio"): ni `Level` ni `application` conocen `RectSpace` — solo builder y mapper son wire legítimamente 2D (el mapper ni lo necesita: consume los campos derivados). La invariante de dimensiones ya no está en `Level`: vive en `RectSpace` (`InvalidBoardSpaceException`). `Arrow` conserva solo las invariantes independientes del espacio (no-vacío, sin-repetidos) y pierde el bloque dr/dc. `LevelBuilder.build()` construye `new RectSpace(cols, rows)` — wire intacto: `withDimensions(cols, rows)` y `ArrowPrimitives` no cambian, seed y repositorio Prisma no se tocan. Specs (subagente QA): 2 tests de adyacencia mudados de `arrow.entity.spec` a `level.entity.spec` (hueco y diagonal, ahora `InvalidLevelException`); pin nuevo en Arrow y en ArrowFactory (aceptan celdas no adyacentes — dato puro); 3 tests de dimensiones eliminados de `level.entity.spec` (cubiertos por `rect-space.spec`); `level.builder.spec` espera `InvalidBoardSpaceException` sin `withDimensions` y pinnea `space instanceof RectSpace`; fixtures de mapper/controller migradas a la firma nueva. Suite unit completa: 53 suites / 362 tests verdes — golden master del solver y `curated-levels.spec` VERDES SIN TOCARLOS (el solver aún usa `level.cols`/`rows` derivados; migra a `exitLane` en el fragmento 4). eslint limpio.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 060 — refactor(domain): LevelSolver consulta space.exitLane; muere su exitPath privado (back#36, fragmento 4/6)

**Fecha:** 2026-07-15
**Tarea o problema abordado:** El tercer y último clon de `exitPath` del sistema (ADR-0005, inventario 2026-07-14: front `arrow.dart`, front `graph_board_generator.dart`, back `level-solver.ts:111-137`) — un switch dirección→delta de 27 líneas dentro del solver. Restricción crítica: el golden master del solver (back#39) y `curated-levels.spec` pinnean el orden del carril (cercano→frontera), el pelado determinista por índice congelado y la Solución de cada fixture — debían quedar IDÉNTICOS sin tocar snapshots.
**Herramienta de IA utilizada:** Claude Code (Fable 5) — skill arrowmaze-backend.
**Prompt o instrucción proporcionada:** > "ejecuta este handoff" (HANDOFF back#36 BoardSpace, scratchpad 2026-07-15)
**Resultado obtenido:** `peel()` obtiene el carril con `level.space.exitLane(head, headDir)` (la cabeza la calcula el solver: última celda del camino); el método privado `exitPath` y sus imports `Arrow`/`Direction`/`Position` desaparecen — el solver ya no interpreta `Direction` ni hace aritmética de celdas. El Grafo de bloqueos y el pelado por min-heap de índice congelado (C1, ADR-0002) quedan INTACTOS: misma construcción del mapa de ocupación, mismas aristas en el mismo orden (exitLane preserva el orden cercano→frontera y la exclusión de la cabeza del exitPath previo, pinneado por el contract-test del fragmento 2), mismo coste O(carril) — el template method recorre step* sin asignaciones extra por celda en el hot path del peel. Comentarios del servicio actualizados: "borde" generaliza a "frontera" (glosario CONTEXT.md) y se anota que un BoardSpace distinto cambia la geometría sin tocar el algoritmo (la certificación OCP llega en el fragmento 5). Verificación: suite unit completa 53 suites / 362 tests verdes en 4.6s — golden master 19/19 y curated-levels (15 fixtures reales, incluido el 50×50) SIN CAMBIOS ni snapshots tocados; eslint limpio. Único archivo modificado: `level-solver.ts` (−35 líneas netas).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 061 — test(domain): certificación OCP — LevelSolver sobre HoledRectSpace sin editar el solver (back#36, fragmento 5/6)

**Fecha:** 2026-07-15
**Tarea o problema abordado:** ADR-0005 decisión 7: el test decisivo del seam — el MISMO LevelSolver sobre un espacio agujereado construido en memoria, sin editar una línea de consumidor (OCP demostrado, no declamado). Sin esto, la abstracción BoardSpace sería especulativa: nada validaría que la interfaz no quedó con forma rectangular encubierta.
**Herramienta de IA utilizada:** Claude Code (Fable 5) — skills arrowmaze-backend / arrowmaze-qa; escenarios diseñados por el arquitecto, escritura delegada a subagente QA (patrón AAA). El QA verificó a mano los valores esperados contra el algoritmo pinneado ANTES de correr los tests; pasaron a la primera sin ajustar nada.
**Prompt o instrucción proporcionada:** > "ejecuta este handoff" (HANDOFF back#36 BoardSpace, scratchpad 2026-07-15)
**Resultado obtenido:** `level-solver.certification.spec.ts` (4 tests, instancias reales, Level construido directo con `new Level(id, space, arrows)` — posible porque Level acepta cualquier BoardSpace, fragmento 3). Caso 1, el contraste decisivo: flechas idénticas a=[(2,0),(2,1)]→RIGHT y b=[(2,3)]→LEFT — sobre `RectSpace(5,5)` sus carriles se contienen mutuamente ⇒ ciclo ⇒ `solve` null / `isSolvable` false; sobre `HoledRectSpace(5,5,[(2,2)])` ambos carriles terminan en el agujero-FRONTERA ⇒ nadie bloquea ⇒ `solve` = ['a','b'] exacto (índice congelado) / true. El bloqueador más allá del agujero deja de bloquear: el carril que termina en agujero cuenta como salida. Caso 2: agujero en (2,3) con flechas [a,d,e] — d, DENTRO del carril truncado de a, sí bloquea; e, más allá del agujero, no ⇒ `solve` = ['d','a','e'] exacto (pelado determinista intacto sobre geometría agujereada). Caso 3: vacuidad sobre espacio agujereado ⇒ [] / true. Suite completa: 54 suites / 366 tests verdes (los 362 previos intactos); eslint limpio; el solver y todo lo demás SIN tocar.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 062 — docs(back): README documenta el módulo space (Template Method + certificación OCP) y verificación final de back#36 (fragmento 6/6)

**Fecha:** 2026-07-15
**Tarea o problema abordado:** Cierre de back#36: el módulo nuevo cambia la superficie arquitectónica del artefacto y el protocolo del repo exige reflejarlo en README; además, verificación final integral del refactor completo antes del PR.
**Herramienta de IA utilizada:** Claude Code (Fable 5) — skill arrowmaze-backend.
**Prompt o instrucción proporcionada:** > "ejecuta este handoff" (HANDOFF back#36 BoardSpace, scratchpad 2026-07-15)
**Resultado obtenido:** README: (1) el árbol de arquitectura menciona el módulo de geometría `space/` en `domain/`; (2) fila nueva **Template Method** en la tabla de Design Patterns (`board-space.ts`: `step` como única primitiva, `areAdjacent`/`exitLane` derivados en la base, `RectSpace` con el único switch dirección→delta); (3) la sección Open/Closed suma la certificación del seam (solver sobre `HoledRectSpace` sin editar una línea, carril que termina en agujero = salida). Verificación final integral de la rama: `npm run lint` 0 errores (23 warnings, todos deuda baseline en 5 archivos no tocados por back#36); unit 54 suites / 366 tests verdes en 4.6s (golden master 19/19, curated 15 fixtures reales <10s, certificación OCP 4/4); e2e 5 suites / 18 tests verdes; `prisma/levels/`, manifest y ambos JSON de caracterización con diff VACÍO contra main; greps de aceptación: único `switch` sobre Direction en `RectSpace.step`, cero literales `Direction.X` en producción fuera de `space/`, y la única computación de coordenadas fuera del módulo es el fold max+1 del bounding box en `Level` que deriva los `cols`/`rows` del wire (opción "campos coherentes con el espacio" sancionada por el handoff — sin deltas, sin adyacencia, sin decisiones in/out). NOTA de discrepancia del handoff: pedía Postgres vía docker compose para los e2e, pero la suite e2e corre contra PrismaService MOCKEADO (decisión documentada en `test/create-test-app.ts` y README) — verificada sin Docker y sin tocar la BD local.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 063 — feat(domain): Score.fromRun multiplicativo y Stars.rate (ADR 0006, back#A1)

**Fecha:** 2026-07-16
**Tarea o problema abordado:** Task A1 del sprint de scoring autoritativo: mover la autoridad del cálculo de puntaje y estrellas del front al dominio del back, mediante una fórmula multiplicativa determinista (`Score.fromRun`) y umbrales de calificación (`Stars.rate`), consumidos por el futuro caso de uso de Task A3.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5) — skill arrowmaze-backend, siguiendo TDD (RED ya entregado por qa-engineer).
**Prompt o instrucción proporcionada:** > "Implementa Step 3 (Score.fromRun + constantes nombradas) y Step 4 (Stars.rate + umbrales) exactamente como especifica el brief de Task A1, sin tocar constructores ni miembros existentes de ambas clases."
**Resultado obtenido:**
- `Score.fromRun({moves, optimalMoves, collisions, timeSeconds, timeLimitSec})` en `src/domain/value-objects/score.vo.ts`: fórmula `round(10000 × (optimalMoves/max(moves,optimalMoves))² × 0.8^collisions × 2^(−timeSeconds/(timeLimitSec×0.5)))` con suelo `MIN_WIN_SCORE=100`. Constantes nombradas `BASE`, `MOVE_EXPONENT`, `COLLISION_FACTOR`, `PAR_RATIO`, `MIN_WIN_SCORE` documentadas inline (ADR 0006). Clamps defensivos: `optimalMoves` mínimo 1 (nivel degenerado sin división por cero), `moves` nunca por debajo del óptimo (sin crédito extra), `collisions`/`timeSeconds` no negativos.
- `Stars.rate({moves, optimalMoves, collisions})` en `src/domain/value-objects/stars.vo.ts`: 3★ si 0 choques y `extra ≤ 2`; 2★ si `collisions ≤ 2` y `extra ≤ 6`; 1★ en el resto. Umbrales nombrados `PERFECT_MOVE_TOLERANCE`, `TWO_STAR_MAX_COLLISIONS`, `TWO_STAR_MOVE_TOLERANCE` (misma regla que aplicaba el front; desde ADR 0006 la autoridad es este VO).
- Tests preexistentes (RED, escritos por qa-engineer): `score.vo.spec.ts` (13 casos `fromRun`) y `stars.vo.spec.ts` (7 casos `rate`) — no modificados. GREEN tras la implementación verbatim del brief: `npm test -- score.vo` → 19/19; `npm test -- stars.vo` → 15/15; suite completa `npm test` → 56 suites / 390 tests, todos verdes. `npx tsc --noEmit` no introduce errores nuevos (el único error preexistente en `auth.controller.spec.ts` ya existía en `main` antes de este cambio, verificado con `git stash`).
- Nota de diseño: el caso "run desastroso" (moves=3×óptimo, 4 choques, t=límite) da 114, no el "100" ilustrativo del plan original — la fórmula verbatim del brief es la fuente de verdad; el suelo de 100 se prueba por separado con parámetros extremos.
- Sin cambios en API pública (capa `domain/` pura); README.md no modificado (sin superficie nueva expuesta).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 064 — feat(domain): Level.timeLimitSec obligatorio (ADR 0006, back#A2)

**Fecha:** 2026-07-16
**Tarea o problema abordado:** Task A2 del sprint de scoring autoritativo: `timeLimitSec` pasa de opcional a obligatorio en el constructor de `Level` (posición 4, `id, space, arrows, timeLimitSec, section, paint`), validación incondicional `Number.isInteger(timeLimitSec) && timeLimitSec >= 1`, para que el futuro caso de uso de Task A3 (`Score.fromRun`) siempre tenga un límite de tiempo autoritativo del que dividir. `LevelBuilder.build()` aplica un provisional `max(30, arrows.length * 6)` cuando el llamador no fija `withTimeLimit` (fixtures/datos legados pre-regeneración), única vía por la que la invariante se satisface sin recapturar el catálogo real.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5) — rol `qa-engineer`, skill arrowmaze-qa. El cambio de producción (`level.entity.ts`, `level.builder.ts`, comentario en `prisma-level.repository.ts`) lo aplicó un agente implementador previo (controller-reconstructed report); este entrada cubre el Step 3 de QA: adaptar specs rotos, cubrir los 3 casos nuevos y verificar la suite completa.
**Prompt o instrucción proporcionada:** > "Ajusta los specs rotos por el cambio `Level.timeLimitSec` obligatorio y añade a `level.entity` los casos: timeLimitSec=0 lanza, no entero lanza, timeLimitSec=1 es válido. Verifica que el golden master de LevelSolver sigue 100% verde. Verifica npm test, npx tsc --noEmit y npm run test:e2e en verde antes de commitear."
**Resultado obtenido:**
- `level.entity.spec.ts`: los 4 `new Level(...)` con firma vieja (3-6 argumentos posicionales rotos por el nuevo parámetro obligatorio) reciben `timeLimitSec` explícito (`90` en los casos que no ejercitan esa invariante); el test que antes probaba "timeLimitSec omitido ⇒ undefined" se reescribió como "timeLimitSec omitido (undefined) ⇒ `InvalidLevelException`" (la omisión ya no es un caso válido bajo ADR 0006). Se añaden los 3 casos pedidos por el brief: `timeLimitSec=0` lanza, `timeLimitSec` no entero (`1.5`) lanza, `timeLimitSec=1` es válido (ya presentes en el archivo entregado por el implementador; verificados y conservados sin duplicar).
- `level.mapper.spec.ts` y `level-solver.certification.spec.ts`: 5 call sites de `new Level(...)` que pasaban `undefined` o directamente omitían el 4º argumento reciben `90` (valor arbitrario válido; estos tests no ejercitan la invariante de tiempo).
- Golden master de `LevelSolver` (`level-solver.spec.ts` + `characterization-fixtures.json` + `characterization-solutions.snapshot.json`): NO tocado — construye los niveles vía `LevelBuilder.withTimeLimit(fixture.timeLimitSec)`, que ya delega el provisional al builder cuando el fixture no trae el campo. Confirmado 100% verde (4/4 fixtures, mismo orden de Solución) sin cambiar una línea del JSON ni del spec.
- Regresión inesperada detectada por `npm test` (no por `tsc`, porque compilaba pero cambiaba de valor en runtime): `level.builder.spec.ts` (2 tests) y `prisma-level.repository.spec.ts` (1 test) afirmaban `timeLimitSec` `undefined` cuando el builder no recibe un límite explícito. Actualizados para esperar el provisional `30` (`max(30, 2 flechas × 6)`), con comentario inline explicando el cálculo.
- Regresión e2e detectada por `npm run test:e2e`: `test/levels-themed.e2e-spec.ts` esperaba el wire de `t-smoke` (nivel temático de 3 flechas, sin `timeLimitSec` en su fixture) sin la clave `timeLimitSec`; ahora el mapper la sirve con el provisional `30` (`max(30, 3×6)`). Test actualizado para incluir `timeLimitSec: 30` en el `toEqual`.
- Verificación final: `npx tsc --noEmit` → limpio salvo el único error preexistente en `auth.controller.spec.ts` (TS2554, deuda baseline no tocada). `npm test` → 56 suites / 390 tests verdes. `npm run test:e2e` → 6 suites / 21 tests verdes (contra `maze-db` en Docker, healthy).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 065 — feat(app): SubmitScoreUseCase deriva score/estrellas canónicos desde métricas (ADR 0006, back#A3)

**Fecha:** 2026-07-16
**Tarea o problema abordado:** Task A3 del sprint de scoring autoritativo: `SubmitScoreUseCase` deja de aceptar `score`/`stars` calculados por el cliente y en su lugar los deriva de las métricas crudas de la partida (`moves`, `timeSeconds`, `collisions`) usando `Score.fromRun` (A1) y `Stars.rate` (A1) contra `level.arrows.length` (óptimo) y `level.timeLimitSec` (A2). El cliente sigue mandando un `previewScore` optimista solo para contraste; nunca se persiste ni se usa como fuente de verdad.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5) — skill arrowmaze-backend, TDD GREEN (RED ya entregado por qa-engineer en `submit-score.use-case.spec.ts`, 5 casos).
**Prompt o instrucción proporcionada:** > "Reescribe SubmitScoreUseCase para que derive el score/estrellas canónicos desde las métricas del run (nunca confiar en el cliente), añadiendo ILevelRepository como dependencia; nivel inexistente lanza LevelNotFoundException con el mismo mensaje que GET /levels/:id; divergencia previewScore-vs-canónico se loguea con logger.warn incluyendo userId y levelId, nunca rechaza. Wire en score.module.ts."
**Resultado obtenido:**
- `SubmitScoreCommand` (`src/application/use-cases/submit-score.use-case.ts`) cambia de `{userId, levelId, score, stars, moves, timeSeconds}` a `{userId, levelId, moves, timeSeconds, collisions, previewScore}`. `SubmitScoreUseCase` pasa a recibir 3 puertos: `(scoreRepo: IScoreRepository, levelRepo: ILevelRepository, logger: ILoggerService)`.
- `execute()`: busca el `Level` por `levelId`; si no existe, `throw new LevelNotFoundException(\`Level '${cmd.levelId}' not found\`)` (mismo mensaje que `GetLevelUseCase`, mapeado a 404 por el filtro global). Deriva `Score.fromRun({moves, optimalMoves: level.arrows.length, collisions, timeSeconds, timeLimitSec: level.timeLimitSec})` y `Stars.rate({moves, optimalMoves: level.arrows.length, collisions})`. Si `previewScore !== score.value`, `this.logger.warn(...)` con userId y levelId en el mensaje (nunca rechaza — política ADR 0006). Construye `ScoreEntry` con el score/stars canónicos y persiste; log de éxito con `logger.log`.
- Wiring (`src/adapters/score.module.ts`): `SubmitScoreUseCase` factory ahora inyecta `[SCORE_REPOSITORY_TOKEN, LEVEL_REPOSITORY_TOKEN, LOGGER_SERVICE_TOKEN]`. Elegida la opción de import de módulo (no self-providing): `ScoreModule.imports` añade `LevelModule`, y `src/adapters/level.module.ts` gana `exports: [LEVEL_REPOSITORY_TOKEN]` — sin ciclo (`LevelModule` no importa `ScoreModule`).
- Tests: `submit-score.use-case.spec.ts` (preexistente, RED, no modificado) → GREEN a la primera pasada: `npm test -- submit-score` → 5/5 (deriva+persiste, not-found sin save, mismatch→warn con userId+levelId, match→sin warn, moves inválido→DomainException antes de save). Suite completa `npm test` → 56 suites / 393 tests verdes (+3 por los nuevos casos de A3 sobre el spec existente vs. el conteo de A2).
- `npx tsc --noEmit`: única rotura nueva esperada — `src/adapters/controllers/score.controller.ts(54,7)`: `Object literal may only specify known properties, and 'score' does not exist in type 'SubmitScoreCommand'` (el controller todavía construye el command viejo `{score, stars}`; es responsabilidad de Task A4, no tocado aquí). El error preexistente de `auth.controller.spec.ts` (TS2554) sigue igual, no relacionado.
- Sin cambios en API pública HTTP todavía (el DTO/controller siguen viejos hasta A4); README.md no modificado.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 066 — feat(adapters): switch POST /scores to run-metrics contract with canonical response (ADR 0006, back#A4)

**Fecha:** 2026-07-16
**Tarea o problema abordado:** Task A4, cierre del sprint de scoring autoritativo: exponer el nuevo contrato de `POST /scores` en la capa HTTP. El DTO deja de aceptar `score`/`stars` calculados por el cliente y pasa a exigir las métricas crudas de la partida (`moves`, `timeSeconds`, `collisions`, `previewScore`); la respuesta 201 se reduce al par canónico `{score, stars}` derivado por `SubmitScoreUseCase` (A3). Nivel inexistente → 404.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5) — rol `qa-engineer` (skill arrowmaze-qa), tras implementación de producción entregada por un agente `backend-architect` previo (DTO/controller/mapper ya en verde salvo specs).
**Prompt o instrucción proporcionada:** > "Actualiza `score.controller.spec.ts` y `score.mapper.spec.ts` al contrato nuevo de POST /scores (request `{levelId, moves, timeSeconds, collisions, previewScore}` → response `{score, stars}` del use case mockeado) y, si hay e2e de scores en `test/`, ajústalo; verifica tsc/npm test/test:e2e en verde; actualiza README y AI_HISTORY; commit."
**Resultado obtenido:**
- `src/adapters/controllers/score.controller.spec.ts`: el test `submitScore` arma el `dto` nuevo (`{levelId, moves, timeSeconds, collisions, previewScore}`), verifica que `SubmitScoreUseCase.execute` se llama con ese mismo shape (más `userId` del request) y que el resultado es `{score, stars}` (ya no el DTO plano con `id`/`userId`/`createdAt`). El test de propagación de `InvalidScoreException` usa el mismo dto nuevo.
- `src/adapters/mappers/score.mapper.spec.ts`: eliminado el test de `toDto` (método borrado en A4 por dead code); añadido test de `toSubmitResponse` que mapea `entry.score.value`/`entry.stars.value` → `{score, stars}`. El test de `leaderboardRowToDto` queda intacto.
- e2e: no existe (ni existía) un `*scores*.e2e-spec.ts` en `test/` — el directorio solo tiene `auth-me`, `cors`, `error-contract`, `levels-themed`, `openapi`, `solution-endpoint`. Por alcance del brief ("si hay e2e de scores"), no se crea un harness nuevo desde cero; no se toca `test/`.
- README (`MazePruebaBack/README.md`, sección `## API Endpoints`): fila de `POST /scores` actualizada a "Submit a completed run's metrics; the back derives the canonical `score`/`stars` (404 if the level does not exist)"; bloque de ejemplo JSON reescrito con el body nuevo (`moves`/`timeSeconds`/`collisions`/`previewScore`) y la respuesta canónica `{score, stars}`, más nota de que `previewScore` es solo contraste (se loguea, nunca rechaza) y de los 404/400.
- Verificación: `npx tsc --noEmit` → limpio salvo el único error preexistente de baseline (`auth.controller.spec.ts` TS2554). `npm test` → 56 test suites / 393 tests, todos verdes. `npm run test:e2e` → 6 test suites / 21 tests, todos verdes (contenedor `maze-db` sano en `localhost:5432`, niveles de campaña sembrados).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 067 — test(back): add coverage for GET /leaderboard (global ranking, ADR 0006, back#A5)

**Fecha:** 2026-07-16
**Tarea o problema abordado:** Task A5, cierre del sprint de scoring autoritativo: cubrir con tests la implementación de producción ya entregada del ranking global de jugadores (`GET /leaderboard` → `{top, me}`), reparar el daño colateral en specs existentes por el ensanche del puerto `IScoreRepository` (`findGlobalTotals`), y verificar el flujo HTTP con un e2e nuevo.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5) — rol `qa-engineer` (skill arrowmaze-qa), tras implementación de producción entregada por un agente `backend-architect` previo (`GetGlobalLeaderboardUseCase` con su spec de 6 casos ya en verde, controlador/módulo/repo Prisma ya en verde salvo specs).
**Prompt o instrucción proporcionada:** > "Repara el daño colateral en `get-leaderboard.use-case.spec.ts` y `submit-score.use-case.spec.ts` por el ensanche del puerto; añade casos de `findGlobalTotals` a `prisma-score.repository.spec.ts`; añade cobertura de `GET /leaderboard` a `score.controller.spec.ts`; añade o extiende un e2e para la ruta global; actualiza README y AI_HISTORY; commit."
**Resultado obtenido:**
- `src/application/use-cases/get-leaderboard.use-case.spec.ts` y `submit-score.use-case.spec.ts`: el literal de `mockScoreRepo` gana `findGlobalTotals: jest.fn()` — el puerto `IScoreRepository` ya no es satisfecho sin él tras el ensanche de A5.
- `src/infrastructure/database/prisma-score.repository.spec.ts`: nuevo `describe('findGlobalTotals')` con tres casos — (a) `groupBy` se llama `by: ['userId', 'levelId']` filtrado a los `campaignLevelIds` recibidos; (b) suma `_max.score`/`_max.stars` por usuario cuando el mismo usuario aparece en varios niveles agrupados; (c) fallback `player_<8 primeros chars del userId>` cuando `user.findMany` no resuelve un `userId` del agregado.
- `src/adapters/controllers/score.controller.spec.ts`: constructor del `ScoreController` actualizado a los 3 argumentos (se añadió `mockGetGlobalLeaderboardUseCase`); nuevo `describe('getGlobalLeaderboard')` con 3 casos — delega en `GetGlobalLeaderboardUseCase.execute` con el `userId` del request y el `limit` parseado, devolviendo el `GlobalLeaderboard` tal cual (sin mapper); pasa `undefined` cuando no hay query param; coexiste con `GET /leaderboard/:levelId` como ruta distinta (ambos use cases invocables de forma independiente en el mismo test).
- `test/create-test-app.ts`: `PrismaServiceMock` ensanchado con `user.findMany` y el modelo `scoreEntry` (`create`/`findMany`/`groupBy`) — necesarios para que el e2e nuevo pueda simular Prisma sin tocar Postgres; los e2e existentes no usan los campos nuevos y siguen verdes.
- `test/leaderboard-global.e2e-spec.ts` (nuevo, no existía un e2e de leaderboard): registra un usuario fresco vía `POST /auth/register` (JWT real, Prisma mockeado), llama `GET /leaderboard` con el bearer y afirma forma de contrato — `top` es array, `me` es `null` (el usuario recién creado no tiene scores) — sin asumir `top` vacío (no se garantiza que la base esté libre de otros jugadores). Segundo test: 401 sin token.
- README (`MazePruebaBack/README.md`, sección `## API Endpoints`): fila nueva `GET /leaderboard` (Yes/JWT) — "Global player ranking: best-per-level campaign totals, `{top, me}` (`me` = requesting user's row or `null`)", antes de la fila existente de `GET /leaderboard/:levelId`.
- Verificación: `npx tsc --noEmit` → limpio salvo el único error preexistente de baseline (`auth.controller.spec.ts` TS2554). `npm test` → 57 test suites / 405 tests, todos verdes. `npm run test:e2e` → 7 test suites / 23 tests, todos verdes (contenedor `maze-db` sano en `localhost:5432`).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 068 — chore(db): wipe legacy additive-formula score entries (ADR 0006, back#A6)

**Fecha:** 2026-07-16
**Tarea o problema abordado:** Task A6, cierre de la Parte A del sprint de scoring autoritativo: crear la migración "borrón y cuenta nueva" que vacía `ScoreEntry` porque los scores calculados con la fórmula aditiva anterior son incomparables con los de la nueva fórmula multiplicativa (ADR 0006) — conservarlos fosilizaría el ranking global recién introducido en A5.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5) — rol `backend-architect` (skill arrowmaze-backend).
**Prompt o instrucción proporcionada:** > "Crea la migración ADR-0006 que vacía ScoreEntry (DELETE FROM \"ScoreEntry\"), verifica que corre contra la DB real, y deja test:e2e en verde."
**Resultado obtenido:**
- `prisma/migrations/20260716120000_wipe_score_entries_adr_0006/migration.sql`: sentencia única `DELETE FROM "ScoreEntry";` con comentario explicando la razón (ADR 0006 — fórmula multiplicativa incomparable con la aditiva previa; los niveles se regeneran aparte, esto solo purga scores).
- **Caveat de tooling**: la DB de dev (`maze-db`, `localhost:5432`, `arrow_maze`) fue provisionada con `prisma db push`, no con historial de migraciones — `npx prisma migrate dev --create-only` detecta "drift" (schema no vacío, migraciones no baselineadas) y exige `prisma migrate reset` (destructivo, se descartó). Por eso el directorio de migración se creó manualmente con timestamp `20260716120000` (posterior a `20260714183520_themed_section_paint`, el último existente) y se verificó la SQL directamente contra la DB viva con `npx prisma db execute --schema prisma/schema.prisma --file <migration.sql>`, sin pasar por `migrate dev/deploy`. En despliegue (Docker/CI), donde el historial de migraciones sí está baselineado, `migrate deploy` aplicará este archivo con normalidad.
- Verificación del `DELETE`: conteo de `ScoreEntry` vía Prisma Client (`prisma.scoreEntry.count()`) antes = 0, después = 0 (la DB de dev no tenía scores legacy cargados en este momento); la sentencia se ejecutó sin error, confirmando permisos y sintaxis correctos contra la tabla real.
- `npm run test:e2e` → 7 test suites / 23 tests, todos verdes (contenedor `maze-db` sano).
- Sin cambios en `prisma/schema.prisma` (migración solo de datos) ni en código de aplicación. README no modificado (no hay endpoint ni contrato público nuevo).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 069 — feat(db): regenerate heart + happy-face themed seeds at higher mask resolution (back#47)

**Fecha:** 2026-07-16
**Tarea o problema abordado:** back#47 — reemplazar los fixtures temáticos `t-heart` y `t-happy-face` por su versión regenerada a mayor resolución de máscara (figuras más nítidas, mismas regiones de color), dejando `t-bunny` intacto byte-a-byte, y re-sembrar. Las máscaras fuente viven en el front (MazePruebaFront#112); este lado es el swap de fixtures + manifiesto + reseed.
**Herramienta de IA utilizada:** Claude Code (Opus 4.8) — rol `backend-architect` (skill arrowmaze-backend).
**Prompt o instrucción proporcionada:** > "Resuelve el issue#47 que está en el repositorio del backend."
**Resultado obtenido:**
- `prisma/levels/t-heart.json`: 16×14/23 flechas → **24×16/51 flechas**, región `heart`. Derivado del JSON temático del front (`themed-heart.json`, seed 74) izando `levelId=t-heart`, `section=themed` y `palette` antes de `arrows` (misma forma de fixture que el resto del catálogo).
- `prisma/levels/t-happy-face.json`: 16×16/38 → **24×22/72 flechas**, regiones `face`+`features` (seed 94). Misma transformación.
- `prisma/levels/t-bunny.json`: **sin cambios** (verificado con `git diff` vacío).
- `prisma/levels/manifest.md`: tabla de la sección temática actualizada (dims, seed, cobertura, flechas) solo para heart y happy-face; fila del bunny intacta.
- **Certificación sin BD**: `npx jest src/infrastructure/database/curated-levels.spec.ts` → 44/44 verde. Ese spec carga los fixtures de disco y corre el MISMO guardrail que el seeder (`LevelBuilder` reconstruye invariantes de tablero + `LevelSolver.isSolvable` + `validateLevelPaint`), así que la solubilidad y la validez de pintado quedan verificadas y el `prisma db seed` tendrá éxito. `test/levels-themed.e2e-spec.ts` (mock) → 5/5 verde.
- **Reseed pendiente**: `npm run db:seed` (prisma db seed) requiere una BD Postgres viva (Docker). No hay contenedor `maze-db` corriendo en este entorno, así que el reseed real lo ejecuta el equipo en Docker; los fixtures ya están certificados como sembrables.
- README no modificado (sin endpoint ni contrato público nuevo; la sección temática ya existía por back#31/ADR 0004).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 070 — feat(back/domain): opaque LevelSilhouette carrier on Level + builder (#53)

**Fecha:** 2026-07-17
**Tarea o problema abordado:** Task 8 del plan cruzado de niveles temáticos con figura (corazón, cara feliz, conejo): añadir al dominio backend el portador opaco `LevelSilhouette`, primer paso del wire field `silhouette` que viajará al cliente. Mismo trato que `LevelPaint` (ADR 0004) — el dominio no valida ni interpreta la máscara; la validación de forma llega en una tarea posterior (seed).
**Herramienta de IA utilizada:** Claude Code (Sonnet 5) — rol `backend-architect` (skill arrowmaze-backend).
**Prompt o instrucción proporcionada:** > "Task 8 del plan SDD themed-masked-board-redesign: añade el 7º parámetro opcional `silhouette` a `Level` (tras `paint`) y `LevelBuilder.withSilhouette`, portador opaco sin validación, espejo exacto de `paint`. TDD: tests primero, FAIL, implementar, PASS."
**Resultado obtenido:**
- `src/domain/entities/level.entity.ts`: nuevo tipo exportado `LevelSilhouette = Readonly<Record<string, ReadonlyArray<readonly [number, number]>>>` (clave = nombre de región, valor = celdas `[row, col]` de relleno), con comentario en el mismo espíritu que `LevelPaint` explicando la decisión de portador opaco. `Level` gana el 7º parámetro posicional opcional `silhouette?: LevelSilhouette`, inmediatamente después de `paint`, sin ninguna validación añadida al constructor.
- `src/domain/entities/level.builder.ts`: `LevelBuilder` gana `private silhouette?: LevelSilhouette`, `withSilhouette(silhouette?: LevelSilhouette): this` (passthrough puro, mismo comentario de portador opaco que `withPaint`), y `build()` propaga `this.silhouette` como 7º argumento posicional al constructor de `Level`.
- `src/domain/entities/level.entity.spec.ts`: nuevo caso `should carry silhouette as opaque data without validating its content, leaving it undefined when omitted (task 8)` — construye un `Level` con silhouette arbitrario (`{ heart: [[0,0],[0,1]]] }`) y otro sin él, afirma que el primero lo expone tal cual (`toEqual`) y el segundo lo deja `undefined`.
- `src/domain/entities/level.builder.spec.ts`: nuevo `describe('withSilhouette')` con dos casos — silhouette queda `undefined` cuando nunca se fija, y `build()` propaga el silhouette fijado sin tocarlo.
- TDD verificado: ambos specs nuevos fallaron primero (`TypeError: withSilhouette is not a function` y `Received: undefined`), luego pasaron tras la implementación.
- Verificación: `npm test` → 57 test suites / 425 tests, todos verdes. `npm run lint:check` → 0 errores, 28 warnings preexistentes (`no-unsafe-argument` en módulos NestJS y specs, sin relación con este cambio). `npm run build` → sin salida, exit 0.
- README no modificado (sin contrato público nuevo; `silhouette` todavía no viaja al wire — eso llega en la tarea del read-path).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 071 — feat(back/db): validate and persist themed silhouette in seed (#53)

**Fecha:** 2026-07-17
**Tarea o problema abordado:** Task 9 del plan cruzado de niveles temáticos con figura: cerrar la frontera del seed para el wire field `silhouette` (LevelSilhouette, entrada 070) — el dominio lo trata como portador opaco, así que el seed es el ÚNICO gate. Espejo exacto de `level-paint.validator.ts` (ADR 0004, back#31): un `SilhouetteFixtureShape`, una `validateLevelSilhouette(fixture)` que lanza `Error` a la primera violación.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5) — rol `backend-architect` (skill arrowmaze-backend).
**Prompt o instrucción proporcionada:** > "Task 9 del plan SDD themed-masked-board-redesign: crea `level-silhouette.validator.ts` espejo de `level-paint.validator.ts` con las reglas — silhouette ausente ok, presente no vacío, cada rol referencia palette, cada celda par entero in-bounds, sin duplicados intra-región, sin solape entre regiones, toda celda de toda flecha ∈ unión de la silueta. Wire en `prisma/seed.ts`: campo en `LevelFixture`, llamada en `validate()` tras `validateLevelPaint`, spread condicional en `toData()`. TDD: un test por regla, FAIL, implementar, PASS."
**Resultado obtenido:**
- `src/infrastructure/database/level-silhouette.validator.ts` (nuevo): `SilhouetteFixtureShape` (`levelId`, `cols`, `rows`, `palette?`, `silhouette?: Record<string, number[][]>`, `arrows: { id, cells }[]`) y `validateLevelSilhouette(fixture)`. Reglas en orden: silhouette ausente → retorna (campaña ok); presente y vacío → throw `/empty/`; por región, rol sin palette → throw `/missing from the palette/`; celda no par entero (`Array.isArray` + `length===2` + `Number.isInteger` en ambos) → throw `/integer pair/`; celda fuera de `[0,cols)×[0,rows)` → throw `/out of bounds/`; celda duplicada dentro de la región (`Set` por región) → throw `/duplicate/`; celda que ya está en la unión acumulada de regiones previas → throw `/overlap/`; tras construir la unión completa, toda celda de toda flecha del fixture debe estar en esa unión → throw `/outside the silhouette/`. Mismo estilo de mensaje que `level-paint.validator.ts` (`Level ${levelId}: ... — refusing to seed.`).
- `src/infrastructure/database/level-silhouette.validator.spec.ts` (nuevo): 9 casos AAA, uno por regla — válido (silueta cubre las flechas), ausente (campaña, sin palette), mapa vacío, rol sin palette, celda no entera (cast `as unknown` para forzar el `0.5` a través del tipo), celda fuera de rango, celda duplicada intra-región, solape entre dos regiones, flecha fuera de la unión.
- `prisma/seed.ts`: `LevelFixture` gana `silhouette?: Record<string, number[][]>`; `validate()` llama `validateLevelSilhouette(fixture)` inmediatamente después de `validateLevelPaint(fixture)`; `toData()` gana el spread condicional `...(fixture.silhouette !== undefined ? { silhouette: fixture.silhouette } : {})` — igual trato que `palette`, sin migración Prisma (viaja dentro de la columna JSON `data`, ADR 0004). Comentarios de cabecera y de `validate()`/`toData()` actualizados para mencionar la silueta junto al pintado.
- TDD verificado: el spec falló primero (`Cannot find module './level-silhouette.validator'`), luego los 9 casos pasaron tras implementar.
- Ningún fixture existente (`t-heart.json`, `t-happy-face.json`, `t-bunny.json`) tiene `silhouette` todavía — la regla de ausencia los deja intactos; poblar la máscara real es trabajo de una tarea posterior.
- Verificación: `npm test` → 58 test suites / 434 tests, todos verdes. `npm run lint:check` → 0 errores, 28 warnings preexistentes (mismas que entrada 070, sin relación). `npm run build` → exit 0. `npm run test:e2e` → 7 suites / 23 tests verdes.
- README no modificado (sin contrato público nuevo; nada cambia para el cliente hasta la tarea del read-path).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 072 — feat(back/read-path): serve themed silhouette through repo and mapper (#53)

**Fecha:** 2026-07-17
**Tarea o problema abordado:** Task 10 del plan cruzado de niveles temáticos con figura — el último eslabón del wire field `silhouette`: hacer que la API lo sirva de verdad en `GET /levels/:id`. El dominio (entrada 070) y el seed (entrada 071) ya lo cargan y validan; sin este paso el cliente no puede ver ninguna silueta. Mismo trato que `paint` (ADR 0004) en toda la cadena repo → mapper → controller.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5) — rol `backend-architect` (skill arrowmaze-backend).
**Prompt o instrucción proporcionada:** > "Task 10 del plan SDD themed-masked-board-redesign: iza `data.silhouette` a `level.silhouette` en `PrismaLevelRepository.toDomain` vía `.withSilhouette(...)`, emite `LevelResponseDto.silhouette` en el mapper con spread condicional (espejo de palette), amplía la descripción Swagger del detalle. TDD: tests primero (repo, mapper, e2e), FAIL, implementar, PASS. GET /levels no cambia."
**Resultado obtenido:**
- `src/infrastructure/database/prisma-level.repository.ts`: `LevelDataPrimitives` gana `silhouette?: LevelSilhouette` (import type desde `level.entity.ts`); `toDomain` encadena `.withSilhouette(data.silhouette)` tras `withPaint` — passthrough directo, sin transformación (la forma del JSON ya coincide con `LevelSilhouette`), `undefined` cuando el JSON no la trae.
- `src/adapters/mappers/level.mapper.ts`: `LevelResponseDto` gana `silhouette?: Record<string, number[][]>`; `toDto` añade un spread condicional espejo del de `palette` — `...(level.silhouette !== undefined ? { silhouette: { ...level.silhouette } as unknown as Record<string, number[][]> } : {})` (el cast doble es necesario porque `LevelSilhouette` es readonly de punta a punta y TS rechaza la conversión directa a `number[][]` mutable; a runtime es un no-op). Una flecha campaña no emite la clave `silhouette` en absoluto.
- `src/adapters/controllers/level.controller.ts`: solo Swagger — la `@ApiOperation`/`@ApiResponse` del detalle (`GET /levels/:id`) amplían su descripción para mencionar el root `silhouette` (región → celdas `[row, col]`) junto a palette/paintRole. Sin lógica nueva.
- Tests nuevos (TDD, fallaron primero con `undefined`/objeto ausente, luego pasaron):
  - `prisma-level.repository.spec.ts`: nuevo caso "should rebuild a themed Level lifting silhouette into the domain carrier (back#53)" (verifica el hoist deep-equal) + assert añadido en el caso de retro-compat de que `result?.silhouette` es `undefined` sin la columna.
  - `level.mapper.spec.ts`: dos casos nuevos — "should omit silhouette entirely when the level has no silhouette carrier (#53)" y "should pass silhouette through intact for a themed level (deep equality round-trip, #53)" — con un nivel temático construido con `silhouette` como 8º parámetro posicional de `Level`.
  - `test/levels-themed.e2e-spec.ts`: el fixture in-memory `themedRecord.data` gana `silhouette` (regiones `ojo`/`cara`); el test de round-trip ("round-trips palette, per-arrow paintRole and silhouette intact (#53)") verifica que `GET /levels/t-smoke` la devuelve byte a byte; el test de campaña legacy verifica también `not.toHaveProperty('silhouette')`. `GET /levels` (catálogo) no se tocó — sus asserts `toEqual({levelId, section})` ya prueban por construcción que no hay clave `silhouette` de sobra.
- Verificación real ejecutada:
  - `npm test` → 58 test suites / **437 tests**, todos verdes (434 previos + 3 nuevos).
  - `npm run test:e2e` → 7 test suites / 23 tests, todos verdes.
  - `npm run lint:check` → 0 errores, 28 warnings preexistentes (idénticas a las de las entradas 070/071, sin relación con este cambio; un error de prettier surgido durante la implementación — import multilínea y objeto anidado sin formatear — se corrigió con `npx prettier --write` antes de esta verificación final).
  - `npm run build` → exit 0, sin salida de error.
- Sin migración Prisma (silhouette sigue viajando dentro de la columna JSON `data`, ADR 0004 — igual que `paint`).
- `README.md`: fila de `GET /levels/:id` en la tabla de endpoints, nota bajo la tabla sobre metadata opaca, y el ejemplo JSON del nivel temático actualizados para incluir `silhouette` — contrato público del endpoint cambia, así que corresponde documentarlo (regla del proyecto).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 073 — feat(back/db): dense themed seeds with silhouette; bunny arrows frozen (#53)

**Fecha:** 2026-07-17
**Tarea o problema abordado:** Task 11 del plan cruzado de niveles temáticos con figura — la tarea de UNIÓN cross-repo: llevar los 3 fixtures temáticos regenerados densos por el front (task 7, `MazePruebaFront/tool/level_production/themed/`) a los seeds del back (`prisma/levels/t-*.json`), con `silhouette` incluida. Sin esta tarea el front y el back divergen silenciosamente: el cliente pintaría una figura y el API serviría otra.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5) — rol `backend-architect` (skill arrowmaze-backend), tarea cross-repo con brief en `MazePruebaFront/.superpowers/sdd/task-11-brief.md` + contexto de controlador en `MazePruebaBack/.superpowers/sdd/task-11-context.md`.
**Prompt o instrucción proporcionada:** > "Task 11 del plan SDD themed-masked-board-redesign: copia/transforma los 3 fixtures temáticos fuente del front (`themed-heart.json`, `themed-happy_face.json`, `themed-bunny.json`) a `prisma/levels/t-heart.json`, `t-happy-face.json`, `t-bunny.json` — renombra `levelId` (`themed-<name>` → `t-<name>`, guion bajo → guion), añade `section: 'themed'`, todo lo demás (cols/rows/palette/arrows/silhouette) idéntico. Verifica la equivalencia semántica front↔back programáticamente, no a ojo. t-bunny queda congelado en exactamente 37 flechas — no regenerar. Extiende `curated-levels.spec.ts` (describe 'themed fixtures') con: silhouette presente + `validateLevelSilhouette` no lanza para los 3; guardián de densidad ≥0.90 sobre la unión de la silueta para t-heart/t-happy-face (medir, no asumir); t-bunny con exactamente 37 flechas; campaña sigue sin `silhouette`. Actualiza `manifest.md` preservando intacta la sección de campaña (#52)."
**Resultado obtenido:**
- Script one-off en el directorio scratch del sistema (fuera del repo, borrado tras usarlo — nunca llegó a estar staged): lee los 3 JSON fuente del front, construye `{ levelId, section: 'themed', cols, rows, palette, arrows, silhouette }` y escribe con CRLF + newline final (mismo byte-layout que los fixtures existentes del back). Un segundo script de verificación deep-equal confirmó, campo por campo (`cols`, `rows`, `palette`, `arrows`, `silhouette` vía comparación de JSON con claves ordenadas) y `levelId`/`section` aparte, que front y back son SEMÁNTICAMENTE IDÉNTICOS para los 3 fixtures — salida real:
  - `t-heart.json: EQUIV OK | arrows=190 | silUnion=608 arrowUnion=601 coverage=0.9885`
  - `t-happy-face.json: EQUIV OK | arrows=129 | silUnion=392 arrowUnion=384 coverage=0.9796`
  - `t-bunny.json: EQUIV OK | arrows=37 | silUnion=172 arrowUnion=150 coverage=0.8721`
  - Coberturas medidas coinciden exactamente con las reportadas por el front (task-11-context.md): heart ≈0.9885, happy_face ≈0.9796 — sin desviación.
- `prisma/levels/t-heart.json`, `t-happy-face.json`, `t-bunny.json`: reemplazados íntegros con los datos del front — heart pasa de 51 a 190 flechas (24x16 → 36x24), happy-face de 72 a 129 flechas (dims 24x22 sin cambio), bunny se mantiene en 37 flechas (16x20) byte-idénticas salvo la nueva clave `silhouette`.
- `prisma/levels/manifest.md`: sección "Themed section" ampliada con un bloque "Dense regen + silhouette (back#53)" documentando la regeneración densa, la propiedad de equivalencia verificada, y la tabla con dims/arrows/coverage por fixture actualizados; la sección de campaña (#52) queda intacta, sin tocar.
- `src/infrastructure/database/curated-levels.spec.ts`: `ThemedLevelFixture` gana `silhouette?: Record<string, number[][]>`; nueva función local `silhouetteCoverage(fixture)` (mismo cálculo que el guardián del front: celdas de flecha distintas dentro de la unión de `silhouette`, sobre el tamaño de esa unión). Dentro de `describe('themed fixtures')`: `it.each` que exige `silhouette` definida y `validateLevelSilhouette(fixture)` sin throw para los 3; `describe('density guardian...')` con `it.each` sobre t-heart/t-happy-face (bunny excluido) que exige cobertura ≥0.90; test dedicado que fija t-bunny en exactamente 37 flechas; el test de metadata de campaña ampliado para exigir también ausencia de `silhouette`.
- Verificación real ejecutada: `npm test` → 58 test suites / **443 tests**, todos verdes (67 en `curated-levels.spec.ts`, +6 sobre la entrada 072). `npm run test:e2e` → 7 test suites / 23 tests, todos verdes. `npm run lint:check` → 0 errores, 28 warnings preexistentes (idénticas a entradas 070–072). `npm run build` → exit 0.
- Sin migración Prisma (silhouette sigue viajando en la columna JSON `data`). `git status` confirmó, antes del commit, que ningún script temporal quedó en el árbol de trabajo.
- README.md no modificado: el ejemplo del endpoint ya usa regiones genéricas (`ojo`/`cara`) sin dims/arrow-counts hardcodeados de t-heart, así que no hay contrato público que actualizar por este cambio de datos.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 074 — docs: actualizar README con las specs del enunciado, capturas reales y AI_USAGE.md

**Fecha:** 2026-07-17
**Tarea o problema abordado:** Actualizar `README.md` para cubrir la estructura mínima exigida por el enunciado del proyecto semestral (badges, diagrama embebido, patrones GoF por categoría, AOP, AI Usage Documentation) y crear el `AI_USAGE.md` exigido por la Sección 7.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5); orquestación multi-agente (`ultracode`/Workflow) para el research paralelo — un agente minó `AI_HISTORY.MD` hacia `AI_USAGE.md` y otro auditó la clasificación GoF de los patrones, el conteo de tests y la consistencia del badge de CI contra el código real.
**Prompt o instrucción proporcionada:** > "Necesito que actualices el README de ambos repos con todas las especificaciones que existen en el enunciado del proyecto semestral incluyendo las capturas que hacen falta" (+ "ultracode" para la fase de research del README).
**Resultado obtenido:** Los patrones de diseño se reorganizan en tres categorías GoF (Creacional/Estructural/Comportamiento) verificadas contra el código real por la auditoría — se descarta la reclamación de "Command" sobre los use cases (naming coincidence con el idioma Use Case/Interactor de Clean Architecture, no una instancia estructural de Command) que aparecía en el diagrama del usuario. Se embebe `docs/diagrams/class-diagram.png` (diagrama provisto por el usuario, no generado en esta sesión) en el README. Se corrige la descripción de CI (el workflow real corre lint+test+e2e+build, el README solo mencionaba 3 de los 4 pasos) y se documenta honestamente la ausencia de contract testing (Pact). Se crea `AI_USAGE.md`: herramientas y roles usados, log curado de 16 tareas significativas (prompt/resultado/lecciones) y evaluación crítica honesta con 5 casos concretos donde la IA se equivocó, citados por número de entrada.
**Modificaciones realizadas por el equipo:** Un subagente auxiliar de esta misma tarea modificó accidentalmente este archivo (rellenó el campo "Modificaciones realizadas por el equipo" de decenas de entradas anteriores con texto fabricado); detectado vía `git diff` contra HEAD y revertido íntegramente antes de commitear. Ningún otro contenido de este archivo fue alterado por esta tarea salvo la presente entrada.

## Entrada 075 — feat(domain): Direction a 8 valores

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#58 (D2, primer eslabón del módulo hexagonal, ADR-0007): ampliar el value object `Direction` de 4 a 8 valores (4 ortogonales + 4 diagonales hex) en formato wire canónico camelCase, para que back#59 (`HexSpace`) pueda expresar sus direcciones. Ningún espacio de producción reconoce todavía las diagonales.
**Herramienta de IA utilizada:** Claude Code (Opus 4.8, 1M context); ejecución del plan `docs/superpowers/plans/2026-07-18-back58-direction-8-values.md` con TDD/AAA.
**Prompt o instrucción proporcionada:** > "Lee el handoff y ejecuta el plan" (back#58 Task 1).
**Resultado obtenido:** `src/domain/value-objects/direction.vo.ts`: enum `Direction` ampliado a 8 literales — `UP_LEFT='upLeft'`, `UP_RIGHT='upRight'`, `DOWN_LEFT='downLeft'`, `DOWN_RIGHT='downRight'` sumados a las 4 ortogonales; valor wire = camelCase idéntico al nombre del literal (retro-compatible: los seeds en minúscula no cambian). `src/domain/value-objects/direction.vo.spec.ts` (nuevo, AAA): fija los 8 valores (`toHaveLength(8)`) y su formato wire camelCase. TDD rojo→verde verificado (2 tests). La suite completa sigue verde: añadir valores al enum no rompe el `switch` sin `default` de `RectSpace.step` (Task 2 lo blinda con tripwire). Nota de numeración: la última entrada en `main` era 074 (el plan asumía 075); se usa numeración contigua 075.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 076 — feat(domain): RectSpace.step fail-fast ante diagonales

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#58 (D3): convertir en real el contrato «cada espacio publica su subconjunto de direcciones». `RectSpace` solo publica las 4 ortogonales; pisar en una de las 4 diagonales nuevas era un bug silencioso (el `switch` sin `default` caía por debajo y devolvía la misma celda). Se blinda con un `switch` exhaustivo sobre los 8 valores + tripwire de compilación.
**Herramienta de IA utilizada:** Claude Code (Opus 4.8, 1M context); TDD/AAA sobre el plan back#58 Task 2.
**Prompt o instrucción proporcionada:** > "Lee el handoff y ejecuta el plan" (back#58 Task 2).
**Resultado obtenido:** `src/domain/space/rect-space.ts`: `step` reescrito — las 4 diagonales (`UP_LEFT`/`UP_RIGHT`/`DOWN_LEFT`/`DOWN_RIGHT`) lanzan `InvalidDirectionException` (fail-fast, `code: INVALID_DIRECTION`, 400 por defecto — no toca el filtro); `default: { const _exhaustive: never = dir }` es el tripwire que rompe la compilación si `Direction` gana un 9º valor sin manejarse. Las 4 ortogonales y la frontera (`null`) siguen intactas; `directions` sigue devolviendo exactamente las 4 ortogonales. `src/domain/space/rect-space.spec.ts` (AAA): test parametrizado que exige `toThrow(InvalidDirectionException)` para las 4 diagonales desde una celda interior. TDD rojo→verde verificado (28/28).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 077 — test(domain): ley de contrato BoardSpace — fail-fast ante dirección ajena

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#58 (P1): elevar el fail-fast de `RectSpace.step` (entrada 076) al contrato compartido `BoardSpace`, de modo que back#59 (`HexSpace`) herede la ley gratis — «pisar en una dirección ∉ `directions` lanza `InvalidDirectionException`, nunca devuelve frontera».
**Herramienta de IA utilizada:** Claude Code (Opus 4.8, 1M context); TDD/AAA sobre el plan back#58 Task 3.
**Prompt o instrucción proporcionada:** > "Lee el handoff y ejecuta el plan" (back#58 Task 3).
**Resultado obtenido:** `src/domain/space/board-space.contract.spec.ts`: nueva ley parametrizada sobre `spaceCases` (RectSpace + HoledRectSpace, instancias reales — BoardSpace nunca se mockea) que para cada espacio calcula las direcciones ajenas (`Object.values(Direction)` menos `sut.directions`) y exige `toThrow(InvalidDirectionException)` desde una celda contenida. Verde por construcción: HoledRectSpace hereda `step` de RectSpace (entrada 076); la ley es un test de caracterización que eleva a contrato ese comportamiento. `src/domain/space/board-space.ts`: documentada la precondición en el método abstracto `step` (dir ∈ directions; ajena = fail-fast, no frontera; ley verificada por el contract-spec). Los template methods `areAdjacent`/`exitLane` iteran solo `directions`, así que nunca disparan el fail-fast. Suite `src/domain/space` verde (57/57).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 078 — feat(domain): invariante Level headDir ∈ space.directions

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#58 (P5): el agregado `Level` gana la invariante «cada `arrow.headDir` pertenece a `space.directions`», de modo que un nivel rectangular con una flecha diagonal (o cualquier headDir ajena al espacio) es rechazado en construcción, homogéneamente con las demás validaciones geométricas del constructor.
**Herramienta de IA utilizada:** Claude Code (Opus 4.8, 1M context); TDD/AAA sobre el plan back#58 Task 4.
**Prompt o instrucción proporcionada:** > "Lee el handoff y ejecuta el plan" (back#58 Task 4).
**Resultado obtenido:** `src/domain/entities/level.entity.ts`: en el `for (const arrow of arrows)` del constructor, tras `arrowIds.add(...)` y antes del bucle de celdas, se añade `if (!space.directions.includes(arrow.headDir)) throw new InvalidLevelException(...)`. Punto único de estrangulamiento: `LevelBuilder.build()` construye vía este constructor, así que hereda la garantía sin duplicarla. `src/domain/entities/level.entity.spec.ts` (AAA): test que construye una flecha `headDir: UP_LEFT` con celdas adyacentes e in-space (`[0,0]`,`[0,1]`) en un `RectSpace` — la única razón de rechazo es la nueva invariante — y exige `toThrow(InvalidLevelException)`. TDD rojo verificado (stash de la impl → 1 failed) y verde (17/17). Los fixtures existentes usan solo las 4 ortogonales, así que siguen construyendo.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 079 — fix(domain): parseDirection parsea diagonales camelCase

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#58 (P4): `ArrowFactory.parseDirection` comparaba `raw.toLowerCase()` contra el valor del enum sin normalizar — con los nuevos valores camelCase (`upLeft`) `'upLeft'.toLowerCase() === 'upleft' !== 'upLeft'`, por lo que las diagonales NUNCA harían match. Bug latente que aparece al estrenar los 8 valores.
**Herramienta de IA utilizada:** Claude Code (Opus 4.8, 1M context); TDD/AAA sobre el plan back#58 Task 5.
**Prompt o instrucción proporcionada:** > "Lee el handoff y ejecuta el plan" (back#58 Task 5).
**Resultado obtenido:** `src/domain/entities/arrow.factory.ts`: `parseDirection` ahora baja a minúscula AMBOS lados (`(d as string).toLowerCase() === normalized`), preservando el contrato case-insensitive ya testeado (Postel: estricto al emitir, tolerante al recibir); mensaje de error ampliado a los 8 nombres. Arreglo de mínima modificación (P4). `src/domain/entities/arrow.factory.spec.ts`: tabla del `it.each` parametrizado ampliada con diagonales y variantes de caja (`upLeft`, `UPLEFT`, `downright`, `upRight`, `downLeft`). TDD rojo (5 casos diagonales fallando) → verde (19/19). Los tests de error existentes (`'diagonal'`, `''`) siguen lanzando `InvalidDirectionException`.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 080 — docs(adapters): documentar los 8 literales headDir en el DTO de nivel + README

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#58 (wire): documentar que `headDir` acepta los 8 literales camelCase y que los niveles rectangulares se restringen a las 4 ortogonales, en el DTO de nivel y en el README.
**Herramienta de IA utilizada:** Claude Code (Opus 4.8, 1M context); plan back#58 Task 6.
**Prompt o instrucción proporcionada:** > "Lee el handoff y ejecuta el plan" (back#58 Task 6).
**Resultado obtenido:** DESVIACIÓN del plan: el Task 6 asumía que `ArrowDto` era una clase con `@ApiProperty` (`enum: Object.values(Direction)`), pero en `main` los DTOs de respuesta (`ArrowDto`/`LevelResponseDto` en `src/adapters/mappers/level.mapper.ts`) son **interfaces TypeScript planas** sin decoradores Swagger — la conversión a clases decoradas es trabajo en vuelo en la rama `docs/swagger-response-schemas` (la sesión de planificación arrancó ahí). Aplicar `@ApiProperty` aquí sería scope creep y colisionaría con esa rama. Se aplican las partes portables y en alcance: (1) `level.mapper.ts` — doc-comment en `ArrowDto.headDir` describiendo los 8 literales camelCase + restricción rectangular (equivalente a nivel de interfaz de la `description` del `@ApiProperty` planeado); (2) `README.md` — nota en el bloque del contrato wire (`GET /levels/:id`) enumerando las 8 direcciones y la restricción rectangular. Sin import de `Direction` ni `@ApiProperty` (sin superficie de decorador en `main`). Cuando `docs/swagger-response-schemas` convierta `ArrowDto` a clase decorada, ahí debe añadirse `enum: Object.values(Direction)` + ejemplo `'upLeft'`. `level.mapper.spec.ts` sigue verde (7/7); `tsc --noEmit` sin errores nuevos (el único error es `auth.controller.spec.ts(16,11)`, preexistente en `main`).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 081 — feat(domain): add HexSpace flat-top strategy over the BoardSpace seam

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#59 (Task 1, ADR-0007 D1): primera geometría no rectangular del seam `BoardSpace` — un hexágono flat-top de radio R, segunda implementación de producción tras `RectSpace`. Prepara el terreno para las tareas 2–4 (masked, generador, solver hex).
**Herramienta de IA utilizada:** Claude Code (Sonnet 5); TDD/AAA estricto sobre `task-1-brief.md` (código y casos de test dados verbatim).
**Prompt o instrucción proporcionada:** > "Read your task brief FIRST — it is your requirements, with the exact code and test cases to use verbatim... Follow the brief exactly: RED → GREEN → full suite → AI_HISTORY → commit."
**Resultado obtenido:** `src/domain/space/hex-space.spec.ts` (nuevo, 11 `it`/`it.each` que expanden a 18 casos) escrito primero — falló en rojo con `Cannot find module './hex-space'`. Luego `src/domain/space/hex-space.ts` (nuevo): `HexSpace extends BoardSpace` con `constructor(readonly radius: number)` validando entero ≥ 1 (`InvalidBoardSpaceException`); `directions` publica las 6 direcciones hex (up/down + las 4 diagonales de back#58, sin left/right); coordenadas axiales proyectadas sobre `Position(row,col)` vía `q = col − R, r = row − R` sin tocar el VO; `contains` implementa el hexágono grande `|q| ≤ R ∧ |r| ≤ R ∧ |q+r| ≤ R`; `step` es el único switch dirección→delta hexagonal del artefacto — exhaustivo sobre los 8 valores de `Direction`, `left`/`right` son ajenas (fail-fast, `InvalidDirectionException`, nunca frontera) y el `default` tipado `never` es tripwire de compilación; `cellCount` se deriva de `allCells()` (no de la fórmula 3R²+3R+1, que queda pinneada solo en el spec) para que una subclase que restrinja `contains` herede un `cellCount` coherente; `allCells()` itera el bounding box `(2R+1)²` filtrado por `contains` en orden row-major. `areAdjacent`/`exitLane` se heredan del template method de `BoardSpace` sin redefinirse. Test: RED confirmado (`Cannot find module`) → GREEN 18/18 tras la implementación. Suite completa `npm test`: 60/60 suites, 472/472 tests verdes (sin regresiones). No se tocó `board-space.ts`, `rect-space.ts` ni el solver — solo los dos archivos nuevos.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 082 — feat(domain): add HexMaskedSpace twin and run the space contract laws on hex

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#59 (Task 2, ADR-0007 D5): gemelo enmascarado de `HexSpace` que restringe el hex a un set de celdas ACTIVAS (espejo en positivo del patrón `HoledRectSpace`, que resta agujeros), y extensión del contract-spec compartido de `BoardSpace` para correr las mismas leyes geométricas sobre las dos implementaciones hex además de rect/holed-rect.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5); TDD/AAA estricto sobre `task-2-brief.md` (código y casos de test dados verbatim).
**Prompt o instrucción proporcionada:** > "Read your task brief FIRST — it is your requirements with exact verbatim code and tests... strict TDD, AAA... Do NOT modify hex-space.ts, board-space.ts, rect-space.ts, holed-rect-space.ts, or the solver."
**Resultado obtenido:** `src/domain/space/hex-masked-space.spec.ts` (nuevo, 6 `it`) escrito primero — falló en rojo con `Cannot find module './hex-masked-space'`. Luego `src/domain/space/hex-masked-space.ts` (nuevo): `HexMaskedSpace extends HexSpace` (herencia, NO decorador — la generalización a decorador queda como deuda registrada en el ADR), `constructor(radius, active: readonly Position[])` valida que el set activo no esté vacío y que cada celda activa caiga dentro del hexágono base (`super.contains`), lanzando `InvalidBoardSpaceException` en ambos casos; único override es `contains = super.contains(pos) && this.active.has(...)` — `step`, `exitLane`, `areAdjacent`, `allCells` y `cellCount` heredan coherentes de `HexSpace`. Test: RED confirmado → GREEN 6/6. `src/domain/space/board-space.contract.spec.ts` (modificado): añadidos imports de `HexSpace`/`HexMaskedSpace` y dos entradas nuevas a `spaceCases` (`HexSpace(2)` y un `HexMaskedSpace(2, ...)` con una cruz de 5 celdas activas), llevando el array a 4 casos. Se generalizó el test `should not exceed the bounding box on either axis` (renombrado `should not contain any cell beyond the bounding box of its own cells`) porque sus literales `(3,0)`/`(0,4)` del rect 4×3 caían accidentalmente DENTRO del hex R=2 (p.ej. `(3,0)` tiene q+r=−1, dentro del hexágono); la nueva versión deriva el bounding box de `sut.allCells()` en tiempo de ejecución y prueba una fila/columna más allá del máximo, válido en cualquier geometría. El test `should return null when stepping from a position outside the space...` con `(5,5)` no requirió cambios: verificado que `(5,5)` cae fuera de las 4 geometrías (en hex R=2, r=+3 excede el radio). Contract-spec: GREEN 47/47 tras los cambios, incluida la ley fail-fast (`should throw when stepping... in a direction the space does not publish`) que en hex ejercita `left`/`right` como direcciones ajenas. Suite completa `npm test`: 61/61 suites, 496/496 tests verdes (sin regresiones respecto a la entrada 081: 60→61 suites, 472→496 tests). No se tocó `hex-space.ts`, `board-space.ts`, `rect-space.ts`, `holed-rect-space.ts` ni el solver.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 083 — feat(domain): wire the space descriptor and the hex section through LevelBuilder

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#59 (Task 3, ADR-0007 D4): añadir `'hex'` como sección de producto de primera clase en `LevelSection`, y dar a `LevelBuilder` un único punto de traducción wire→espacio concreto (`withSpace(descriptor)` + `buildSpace()`) que instancia `RectSpace`, `HexSpace` o `HexMaskedSpace` según el descriptor y la silueta presentes.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5); TDD/AAA estricto sobre `task-3-brief.md` (código y casos de test dados verbatim, adaptados a la API real del spec existente).
**Prompt o instrucción proporcionada:** > "Read your task brief FIRST — requirements with exact verbatim code... adapt the brief's tests to the real level.builder.spec.ts helpers/imports... strict TDD, AAA."
**Resultado obtenido:** `src/domain/entities/level.entity.ts` (modificado): `LevelSection = 'campaign' | 'themed' | 'hex'`. `src/domain/entities/level.builder.spec.ts` (modificado): añadido `describe('withSpace (back#59)', ...)` con 6 `it`/`it.each` (rect por defecto sin descriptor, hex ignorando cols/rows del wire, hex+silhouette → `HexMaskedSpace`, headDir foráneo al hex → `InvalidLevelException` — invariante de back#58 heredada de `Level`, descriptor inválido (`type` desconocido, `radius` 0 o no entero) → `InvalidBoardSpaceException`, y `'hex'` como sección de primera clase) — imports nuevos `HexSpace`, `HexMaskedSpace`, `Position`, `SpaceDescriptor`. Los helpers del brief (`withDimensions`, `addArrow({id,headDir,cells})`, `withSilhouette`) coincidían exactamente con la API real del spec — sin adaptación necesaria. RED confirmado (`withSpace is not a function`, sección esperada `hex` recibida `campaign`) → `src/domain/entities/level.builder.ts` (modificado): nuevo `export interface SpaceDescriptor { type: 'hex'; radius: number }`; campo privado `space?: SpaceDescriptor`; `withSpace(space?)` passthrough; `withSection` acepta ahora `'themed' | 'hex'`; `build()` delega la construcción del espacio a nuevo privado `buildSpace()` que: sin descriptor → `RectSpace(cols, rows)` (retrocompat); `type !== 'hex'` → `InvalidBoardSpaceException`; hex + silhouette → `HexMaskedSpace(radius, active)` con `active` = unión de las celdas de todas las regiones de la silueta aplanadas a `Position`; hex sin silhouette → `HexSpace(radius)`. La validación de `radius` (entero ≥ 1) vive solo en `HexSpace`, sin duplicarse en el builder. GREEN 20/20 en `level.builder.spec.ts` + `level.entity.spec.ts` (37/37 combinados). Suite completa `npm test`: 61/61 suites, 504/504 tests verdes (496→504, sin regresiones respecto a la entrada 082). No se tocó `hex-space.ts`, `hex-masked-space.ts`, `rect-space.ts`, el mapper, el repositorio ni el solver.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 084 — feat(back): serve the hex space descriptor through repository and level DTO

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#59 (Task 4, ADR-0007 D4): último eslabón del wire — hacer que el repositorio Prisma reconstruya el `space` descriptor desde el JSON persistido (vía `LevelBuilder.withSpace`, Task 3) y que el mapper lo sirva de vuelta en el DTO de respuesta, contrato de cable para front#125.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5); TDD/AAA estricto sobre `task-4-brief.md` (código y casos de test dados verbatim, adaptados a la estructura real de los specs existentes).
**Prompt o instrucción proporcionada:** > "Read your task brief FIRST — requirements with exact verbatim code... CRITICAL — adapt the brief's tests to the real mock/fixture idiom of the existing specs... strict TDD, AAA."
**Resultado obtenido:** `src/adapters/mappers/level.mapper.spec.ts` (modificado): el spec existente construye `Level` directamente (no vía `LevelBuilder`), así que el nuevo `describe('space descriptor (back#59)', ...)` sigue ese mismo idioma — helper `hexLevel()` con `new Level(id, new HexSpace(2), [arrow UP en (2,2)-(3,2)], 90, 'hex')` — en vez del `LevelBuilder.withSpace(...)` propuesto en el brief. 2 tests: DTO expone `{ type: 'hex', radius: 2 }` con `cols`/`rows` = bounding box 5×5; nivel rectangular omite `space` por completo (`'space' in dto === false`). `src/infrastructure/database/prisma-level.repository.spec.ts` (modificado): nuevo `it` dentro de `describe('findById', ...)` (no un describe nuevo) siguiendo el patrón de mock existente `mockPrisma.level.findUnique.mockResolvedValue(record)` — record hex con `data.space = { type: 'hex', radius: 2 }` y `cols/rows: 0` (se ignoran); verifica `result?.space` instanceof `HexSpace` y `result?.section === 'hex'`. RED confirmado (`dto.space` undefined en el mapper; `RectSpace(0x0)` `InvalidBoardSpaceException` en el repo, porque `withSpace` aún no se invocaba) → implementación: `prisma-level.repository.ts` — import `type { SpaceDescriptor }` desde `level.builder`; `LevelDataPrimitives.space?: SpaceDescriptor`; en `toDomain`, `.withSpace(data.space)` encadenado justo tras `.withDimensions(...)`. `level.mapper.ts` — import `HexSpace`; `LevelResponseDto.space?: { type: 'hex'; radius: number }`; en `toDto`, spread condicional `...(level.space instanceof HexSpace ? { space: { type: 'hex' as const, radius: level.space.radius } } : {})` junto a los spreads existentes de `palette`/`silhouette`; comentario de `LevelSummaryDto.section` actualizado a `'campaign' | 'themed' | 'hex'`. GREEN 18/18 en ambos specs (9+9). Suite completa `npm test`: 61/61 suites, 507/507 tests verdes (504→507, sin regresiones respecto a la entrada 083). `tsc --noEmit`: sin errores nuevos (el único preexistente sigue siendo `auth.controller.spec.ts(16,11)`, no relacionado). No se tocó `level.builder.ts`, `hex-space.ts` ni el solver.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 085 — test(domain): certify LevelSolver over hexagonal levels without solver changes

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#59 (Task 5, ADR-0007): certificar que `LevelSolver` resuelve niveles hexagonales SIN ningún cambio de producción — prueba de que el solver es geometry-agnostic vía el seam `BoardSpace` (ADR 0005/0007), consumiendo `LevelBuilder.withSpace` (Task 3). Tarea de solo tests, cero cambios en `level-solver.ts`.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5); sobre `task-5-brief.md` (código y casos de test dados verbatim), adaptado a los helpers reales del spec existente.
**Prompt o instrucción proporcionada:** > "Read your task brief FIRST — it has the exact verbatim tests... CRITICAL — adapt the brief's tests to the real helpers... these tests should PASS IMMEDIATELY once written... if they FAIL, STOP and report BLOCKED; do NOT modify the solver or weaken the test."
**Resultado obtenido:** `src/domain/services/level-solver.spec.ts` (modificado): nuevo `describe('hexagonal levels (back#59)', ...)` con 2 `it` verbatim del brief, insertado antes de `describe('reproducibility', ...)`. Los helpers del brief (`solver`, `idsOf(result)`, `LevelBuilder`, `LevelId`, `.addArrow(...)`) coincidían exactamente con la API real del spec — sin adaptación de nombres necesaria; se añadió únicamente el operador de aserción de no-nulidad (`idsOf(result)!.sort()`) en el primer test para satisfacer `strict` de TypeScript tras el `expect(result).not.toBeNull()`. Test 1 (`'l-hex-solvable'`, R=2): `a-0` (up, celdas `[1,2]`-`[2,2]`) y `a-1` (down, celdas `[3,2]`-`[3,1]`) — ambos con carril libre, resuelto `['a-0', 'a-1']`. Test 2 (`'l-hex-unsolvable'`, R=2): `a-0` (up, `[2,2]`-`[3,2]`) y `a-1` (down, `[1,2]`-`[0,2]`) — bloqueo mutuo en la misma columna axial, `solve` devuelve `null`. Ambos tests PASARON de inmediato sin tocar `level-solver.ts` (confirmando el AC de geometry-agnosticism): `npx jest level-solver.spec.ts` → 21/21 verdes (19 preexistentes + 2 nuevos). `git status` confirmó que solo `level-solver.spec.ts` cambió — `level-solver.ts` intacto. Suite completa `npm test`: 61/61 suites, 509/509 tests verdes (507→509, sin regresiones respecto a la entrada 084).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 086 — test(domain): add hex characterization fixture to the solver golden master

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#59 (Task 6): añadir un 5º fixture hexagonal (`char-05-hex-lanes`) al golden master de `LevelSolver` (back#30/back#39) para que el guard de regresión hacia adelante cubra también geometría hex, junto a los 4 fixtures rectangulares existentes.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5); sobre `task-6-brief.md` (fixture y cambios de harness dados verbatim), adaptado a la API real de `level-solver.spec.ts`.
**Prompt o instrucción proporcionada:** > "Read your task brief FIRST — exact verbatim fixture JSON and harness changes... Never hand-author the snapshot order — it must be the solver's real output. Never touch the 4 existing fixtures or their snapshots."
**Resultado obtenido:** `src/domain/services/level-solver.spec.ts` (modificado): interface `LevelFixture` extendida con `space?: SpaceDescriptor` (import añadido desde `../entities/level.builder`); `buildLevel` encadena `.withSpace(fixture.space)` tras `.withDimensions(...)`; `expect(fixtures).toHaveLength(4)` → `toHaveLength(5)`. `src/domain/services/characterization-fixtures.json` (modificado): fixture `char-05-hex-lanes` (`order: 5`, `cols`/`rows: 0`, `space: { type: 'hex', radius: 2 }`, 3 flechas — `arrow-0` up, `arrow-1` downRight, `arrow-2` downLeft) añadido al final del array; los 4 fixtures previos intactos (`git diff --stat` → solo inserciones). Corrida dirigida `npx jest -t "char-05-hex-lanes"` → FAIL esperado, `Received: ["arrow-0", "arrow-1", "arrow-2"]` (Solución canónica real del solver, capturada del diff, nunca inventada). `src/domain/services/characterization-solutions.snapshot.json` (modificado): clave `"char-05-hex-lanes": ["arrow-0", "arrow-1", "arrow-2"]` añadida al final, copiada exactamente del `Received`; `git diff` confirma que las 4 entradas previas no cambiaron (solo 5 líneas insertadas). Corrida completa del spec → GREEN 22/22 (21 preexistentes + 1 nuevo). Suite completa `npm test`: 61/61 suites, 510/510 tests verdes (509→510, sin regresiones respecto a la entrada 085). `git status` confirmó que `level-solver.ts` no se tocó.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 087 — docs(back): document hex space, wire descriptor and hex section

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#59 (Task 7): documentación del feature hex ya implementado en Tasks 1-6 — glosario del back (CONTEXT.md) y contrato wire de niveles (README.md). Solo prosa, sin tocar código ni tests.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5); sobre `task-7-brief.md` (contenido exacto a añadir dado en el brief).
**Prompt o instrucción proporcionada:** > "Read your task brief FIRST — it lists the exact content to add... Read the existing CONTEXT.md and README.md to learn their real structure/format/heading style FIRST... match the doc existing tone... find the actual right section — do not bolt it on at the end."
**Resultado obtenido:** `CONTEXT.md` (modificado): tres entradas nuevas al glosario de Niveles, tras "Instrucciones de pintado" y antes de "Cuenta y sesión" — **Espacio hexagonal (HexSpace)** (hex flat-top de radio R sobre el seam BoardSpace, ADR-0007; axiales q=col-R, r=row-R; 6 direcciones; HexMaskedSpace como gemelo restringido a celdas activas; nota explícita de que en hex la silueta es frontera jugable, asimetría consciente frente a rect/temático), **Sección `hex`** (tercer valor de LevelSection, taxonomía ortogonal a la geometría), **Descriptor `space`** (campo wire opcional `{type:"hex", radius}`, ausente implica rect cols×rows, cols/rows siempre bounding box). `README.md` (modificado): dentro del bloque de ejemplos JSON de la sección "API Endpoints", tras el ejemplo `GET /levels/:id → 404`, un nuevo ejemplo `GET /levels/:id → 200 for a HEX level` con el descriptor `space: {type:"hex", radius}`, nota de que cols/rows son siempre el bounding box ((2R+1)^2 para hex) y mención de la sección `hex` como taxonomía ortogonal — ubicado junto a los ejemplos existentes de rect/temático, mismo formato de comentarios jsonc.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 088 — feat(back): extract testable fixture module with hex space support

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#60 (Task 1): extraer del `prisma/seed.ts` monolítico un módulo testable `src/infrastructure/database/level-fixture.ts` que centraliza el camino fixture -> `Level` (build, serialización a `Level.data`, resolución de sección y cálculo del `timeLimitSec` sugerido), añadiendo soporte para el descriptor `space` (hex) que #59 dejó ausente del seed. Es el cimiento compartido por el seed (Task 2), el catalog spec (Task 3) y el script de autoría (Task 4).
**Herramienta de IA utilizada:** Claude Code (Sonnet 5); TDD/AAA estricto sobre `docs/superpowers/plans/2026-07-18-back60-hex-levels-seed.md` (código y casos de test dados verbatim).
**Prompt o instrucción proporcionada:** > "Execute Tasks 1-4 from the plan file, following the TDD steps exactly. The code blocks in the plan are the exact code to write. One commit per task with AI_HISTORY entries."
**Resultado obtenido:** `src/infrastructure/database/level-fixture.spec.ts` (nuevo, transcrito verbatim del plan) escrito primero — falló en rojo con `Cannot find module './level-fixture'`. Luego `src/infrastructure/database/level-fixture.ts` (nuevo, transcrito verbatim del plan): `interface LevelFixture` (superset declarativo del fixture JSON, con `space?: SpaceDescriptor` nuevo sobre la interfaz previa del seed); `buildLevelFromFixture(fixture)` encadena `LevelBuilder.withDimensions/withSpace/withSection/withSilhouette/withTimeLimit` + `addArrow` por cada flecha, único camino fixture->Level; `fixtureToData(fixture)` serializa a `Prisma.InputJsonValue` incluyendo `space` solo cuando está presente — para fixtures rect (sin `space`) el output es byte-idéntico al de antes de back#60; `resolveSection(fixture)` mapea `'hex'|'themed'` literales, cualquier otro valor (o ausencia) a `'campaign'`, espejando `LevelBuilder.withSection`; `suggestTimeLimitSec(solutionLength)` implementa la calibración D6 (`max(30, round(len*4.5/5)*5)`). Test: RED confirmado (`Cannot find module`) → GREEN 15/15 tras la implementación (4 describe: `buildLevelFromFixture` con HexSpace/HexMaskedSpace/RectSpace/headDir diagonal; `fixtureToData` con/sin space; `resolveSection` 4 casos; `suggestTimeLimitSec` 5 casos). No se tocó `level.builder.ts`, `level.entity.ts`, `arrow.factory.ts` ni `prisma/seed.ts` (ese es Task 2).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 089 — refactor(back): seed builds levels through the shared fixture module

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#60 (Task 2): cablear `prisma/seed.ts` al módulo `level-fixture.ts` extraído en la Task 1, eliminando la interfaz `LevelFixture` local y la función `toData` duplicadas, sin cambiar el comportamiento del seed para los 18 niveles existentes.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5); sobre `docs/superpowers/plans/2026-07-18-back60-hex-levels-seed.md` (Task 2, cambios dados verbatim).
**Prompt o instrucción proporcionada:** > "Execute Tasks 1-4 from the plan file, following the TDD steps exactly."
**Resultado obtenido:** `prisma/seed.ts` (modificado): eliminada la `interface LevelFixture` local y la función `toData`; eliminados los imports ahora no usados (`LevelBuilder`, `LevelId`, `ArrowPrimitives`, `Prisma` — este último solo se usaba en la firma de `toData`); añadido `import { LevelFixture, buildLevelFromFixture, fixtureToData, resolveSection } from '../src/infrastructure/database/level-fixture'`. `validate(fixture)` ahora delega la construcción del `Level` en `buildLevelFromFixture` (antes reconstruía manualmente con `LevelBuilder`). En `main`, `toData(fixture)` → `fixtureToData(fixture)` y el cálculo inline de `section` (`fixture.section === 'themed' ? 'themed' : 'campaign'`, que nunca reconocía `'hex'`) → `resolveSection(fixture)`. Se añadió el guard `if (require.main === module) { main().catch(...) }` para que importar el archivo (como hará el catalog spec de la Task 3) nunca dispare un seed real contra la BD. Ajuste no previsto en el plan: `fixtureToData` en `level-fixture.ts` necesitó un cast `as unknown as Prisma.InputJsonValue` sobre el objeto completo (antes solo `arrows` lo tenía) — el campo `space?: SpaceDescriptor` con su literal `type: 'hex'` rompía la inferencia estructural de TypeScript contra la unión `Prisma.InputJsonValue` (`tsc --noEmit` fallaba con "not assignable to type 'string'"); el cast preserva el comportamiento runtime idéntico (JSON.stringify no distingue). Verificación: `npx tsc --noEmit -p tsconfig.json` → sin errores nuevos (el único preexistente, no relacionado, sigue siendo `auth.controller.spec.ts(16,11)`). `npm test -- level-fixture.spec` → 15/15 verdes. `npm test -- level-solver level.builder` → 3 suites, 46/46 verdes (sin regresión).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 090 — test(back): add DB-free catalog spec certifying every level solvable

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#60 (Task 3): spec data-driven que certifica, sin BD, que todo fixture en `prisma/levels/*.json` es soluble y su metadata (paint/silhouette) es válida — replica la validación de `prisma/seed.ts` para correr en CI sin depender de Postgres. Es el guardián sobre el que se apoyarán los niveles hexagonales autorizados en las Tasks 5-8.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5); sobre `docs/superpowers/plans/2026-07-18-back60-hex-levels-seed.md` (Task 3, spec dado verbatim).
**Prompt o instrucción proporcionada:** > "Execute Tasks 1-4 from the plan file, following the TDD steps exactly."
**Resultado obtenido:** `src/infrastructure/database/level-catalog.spec.ts` (nuevo, transcrito verbatim del plan): lee todos los archivos de `prisma/levels/` que matchean `^(level-\d+|t-[a-z0-9-]+|hex-\d+)\.json$` (el patrón `hex-\d+` ya incluido de antemano para que los niveles hex de las Tasks 5-7 se recojan automáticamente en cuanto se autoren, sin tocar este spec); un `it.each` por archivo reconstruye el `Level` vía `buildLevelFromFixture` (Task 1) y exige `solver.isSolvable(level) === true`, `validateLevelPaint` y `validateLevelSilhouette` sin lanzar. Corrida directa contra el catálogo actual (18 fixtures: 15 campaña + 3 temáticos, aún sin niveles hex) → GREEN 19/19 (18 niveles + el test `finds level fixtures`) de inmediato, sin necesidad de tocar Task 1/2 — confirma que la extracción de la Task 1 y el recableado de la Task 2 no regresaron ningún nivel existente (invariante explícita del plan: de haber fallado, había que parar sin forzar el verde).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 091 — feat(back): add standalone hex level authoring/verification script

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#60 (Task 4): script CLI puntual de autoría (`scripts/verify-hex-level.ts`) que carga un fixture candidato, lo resuelve con `LevelSolver` sin BD y reporta resolubilidad, longitud de solución, `timeLimitSec` sugerido y un render ASCII del hexágono — la herramienta con la que se convergerán los niveles hex-01/02/03 y t-snowflake en las Tasks 5-8.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5); sobre `docs/superpowers/plans/2026-07-18-back60-hex-levels-seed.md` (Task 4, código dado verbatim).
**Prompt o instrucción proporcionada:** > "Execute Tasks 1-4 from the plan file, following the TDD steps exactly."
**Resultado obtenido:** `scripts/verify-hex-level.ts` (nuevo, transcrito verbatim del plan): `renderHex(fixture)` calcula el hexágono con las mismas fórmulas axiales de la geometría (`q = col - r`, `rr = row - r`, dentro sí `|q|,|rr|,|q+rr| ≤ r`), marca celdas ocupadas por flecha con un glifo alfanumérico por índice, celdas activas-sin-flecha con `·` y celdas inactivas-dentro-del-hexágono con `×` (silueta ausente ⇒ todo lo `inside` se considera activo); `run()` parsea el path del argv, construye el `Level` vía `buildLevelFromFixture` (saliendo con código 1 y mensaje `BUILD FAILED` si la construcción lanza), imprime metadata + render, resuelve con `new LevelSolver().solve(level)` y reporta `SOLVABLE: NO` (exit 1) o `SOLVABLE: YES  solutionLength=N` + `Suggested timeLimitSec` (vía `suggestTimeLimitSec`, Task 1) + el orden de salida. `npx tsc --noEmit -p tsconfig.json --listFiles` confirmó que el script SÍ entra en el typecheck del proyecto (sin `include`/`exclude` en `tsconfig.json`, todo `.ts` bajo el repo se compila) y no introdujo errores nuevos (el único preexistente sigue siendo `auth.controller.spec.ts(16,11)`, no relacionado). Smoke test: fixture desechable `smoke-hex.json` (R=2, 1 flecha `up` desde `[2,2]`-`[3,2]`) escrito en el scratchpad del sistema — NUNCA bajo `prisma/levels/`, para que ni el loader del seed ni el catalog spec lo recojan — ejecutado con `npx ts-node scripts/verify-hex-level.ts <path>`: salida `SOLVABLE: YES  solutionLength=1` y `Suggested timeLimitSec = 30`, más el render ASCII del hexágono R=2. Fixture desechable borrado tras la verificación.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 092 — feat(levels): author hex-01 free hex level (R=3)

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#60 (Task 5): autoría del primer nivel hexagonal libre `prisma/levels/hex-01.json` (sección `hex`, R=3, 7×7, cronometrado, sin `order`) — el más sencillo de la rampa hex.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5), autoría convergida con `scripts/verify-hex-level.ts` (Task 4) y certificada por `level-catalog.spec` (Task 3).
**Prompt o instrucción proporcionada:** > "Author hex-01.json: section hex, R=3, ~10 arrows, all 6 directions, ~68% fill, converge to SOLVABLE with the verify script."
**Resultado obtenido:** `prisma/levels/hex-01.json` (nuevo): 11 flechas multi-celda (`arrow-0`..`arrow-10`), 25/37 celdas ocupadas (~68%), las 6 direcciones hexagonales representadas. Diseño: columna central (col=3) con cadena de dependencia 3-deep (arrow-3 → arrow-2 → arrow-1 salen en ese orden) más una dependencia cruzada (arrow-10 bloqueada por la cola de arrow-5 hasta que esta sale); las 6 flechas restantes son inmediatamente salibles → curva de dificultad suave-a-moderada. `scripts/verify-hex-level.ts` → `SOLVABLE: YES  solutionLength=11`; `timeLimitSec=50` (valor exacto sugerido por la fórmula D6 `max(30, round5(11*4.5))`). Certificado por `npm test -- level-catalog.spec` (23/23 verdes, incluye hex-01).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 093 — feat(levels): author hex-02 free hex level (R=4)

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#60 (Task 6): autoría del segundo nivel hexagonal libre `prisma/levels/hex-02.json` (sección `hex`, R=4, 9×9, cronometrado, sin `order`) — dependencia más profunda que hex-01.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5), autoría convergida con `scripts/verify-hex-level.ts` y certificada por `level-catalog.spec`.
**Prompt o instrucción proporcionada:** > "Author hex-02.json: section hex, R=4, ~17 arrows, all 6 directions, ~75% fill, deeper dependency."
**Resultado obtenido:** `prisma/levels/hex-02.json` (nuevo): 18 flechas (`arrow-0`..`arrow-17`), 47/61 celdas (~77%), las 6 direcciones representadas. Diseño: 4 flechas de borde anclan las 4 direcciones diagonales cerca de los vértices (3 salen de inmediato; `downLeft` genuinamente bloqueada hasta que `upLeft` sale → dependencia inicial real); las 9 columnas up/down restantes rellenan el grueso, algunas partidas en dos tramos por celdas medias permanentemente vacías. Un primer intento con tramos partidos apuntándose mutuamente causaba deadlock (insoluble); se corrigió reorientando los tramos hacia afuera (tramo superior → up, inferior → down) hacia frontera/celdas ya liberadas. `verify-hex-level.ts` → `SOLVABLE: YES  solutionLength=18`; `timeLimitSec=80` (fórmula D6). Un script generador temporal usado para construir el archivo fue eliminado y no forma parte del diff. Certificado por `level-catalog.spec` (23/23).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 094 — feat(levels): author hex-03 free hex level (R=5)

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#60 (Task 7): autoría del tercer nivel hexagonal libre `prisma/levels/hex-03.json` (sección `hex`, R=5, 11×11, cronometrado, sin `order`) — el más denso de la rampa, con las cadenas de salida más profundas.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5), autoría convergida con `scripts/verify-hex-level.ts` y certificada por `level-catalog.spec`.
**Prompt o instrucción proporcionada:** > "Author hex-03.json: section hex, R=5, ~27 arrows, all 6 directions, ~83% fill, densest with deepest chains."
**Resultado obtenido:** `prisma/levels/hex-03.json` (nuevo): 27 flechas (`arrow-0`..`arrow-26`), 76/91 celdas (83.5%), las 6 direcciones representadas (up:9, down:10, upRight:2, downRight:2, upLeft:2, downLeft:2), sin solapes. Enfoque: en lugar de colocar 27 flechas a mano y esperar que resuelva, se construyó el tablero a partir de "carriles" rectos provablemente solubles — 4 bordes de frontera (que dan las diagonales upRight/downRight/upLeft/downLeft) más carriles up/down por columna para el grueso, cada carril troceado en flechas multi-celda ordenadas estrictamente frontera-primero, de modo que el carril de salida de cada flecha solo depende de flechas más externas del mismo carril (sin interferencia cruzada posible). Resolvió en la primera verificación sin ajuste manual. `verify-hex-level.ts` → `SOLVABLE: YES  solutionLength=27`; `timeLimitSec=120` (fórmula D6 `max(30, round5(27*4.5))`). Certificado por `level-catalog.spec` (23/23).
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 095 — feat(levels): author t-snowflake themed hex level (R=5, masked)

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#60 (Task 8): autoría del nivel temático hexagonal `prisma/levels/t-snowflake.json` (sección `themed`, R=5 enmascarado, 2 roles de paleta, silueta de copo de nieve teselada por flechas).
**Herramienta de IA utilizada:** Claude Code (Sonnet 5), autoría convergida con `scripts/verify-hex-level.ts` (que marca `·` celdas activas sin cubrir) y certificada por `level-catalog.spec` (incluye `validateLevelSilhouette` + `validateLevelPaint`).
**Prompt o instrucción proporcionada:** > "Author t-snowflake: themed, hex R=5 masked, palette {core,snow}, 6-fold snowflake silhouette fully tessellated by arrows, converge to SOLVABLE with no uncovered cells."
**Resultado obtenido:** `prisma/levels/t-snowflake.json` (nuevo): copo de nieve 6-fold-simétrico dentro del hexágono R=5 (centro [5,5]) — cúmulo central de 7 celdas (centro + sus 6 vecinos hex, `paintRole:"core"`, `#3B82F6`) más 6 brazos rectos de 4 celdas por las 6 direcciones hex con puntas en la frontera (`paintRole:"snow"`, `#E8F4FF`) = 31 celdas activas. `palette` `{ core:'#3B82F6', snow:'#E8F4FF' }`; `silhouette` partida en `core`/`snow` disjuntos cuya unión = las 31 celdas. 10 flechas teselan por completo la silueta (6 flechas de brazo + 4 de núcleo: tres pares de 2 celdas y una de 1), sin celdas `·` sin cubrir, sin solapes, `paintRole` de cada flecha acorde al rol de sus celdas. `verify-hex-level.ts` → render de copo limpio sin `·`, `SOLVABLE: YES  solutionLength=10`; `timeLimitSec=45` (fórmula D6, punto abierto §7 del spec resuelto: el temático lleva `timeLimitSec` explícito). Certificado por `level-catalog.spec` (23/23) incluyendo los validadores de silueta y paint.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 096 — test(back): add e2e for hex space wire and section

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#60 (Task 9): e2e que prueba que la API sirve el descriptor `space` en el DTO de nivel y que los niveles de sección `hex` viajan con `section: 'hex'` sin `order`.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5), spec transcrito verbatim del plan (Task 9).
**Prompt o instrucción proporcionada:** > "Create test/levels-hex.e2e-spec.ts with the exact code from the plan; verify 3/3 pass."
**Resultado obtenido:** `test/levels-hex.e2e-spec.ts` (nuevo): mismo patrón de PrismaService mockeado que `levels-themed.e2e-spec.ts` (contrato HTTP, no BD). 3 casos: (1) el catálogo expone `section: 'hex'` para niveles hex libres; (2) `GET /levels/:id` sirve el descriptor `space: { type:'hex', radius:3 }` en el DTO; (3) round-trip de un nivel temático hex con `palette`, `silhouette` y `space`. `npm run test:e2e -- levels-hex` → 3/3 verdes — confirma que el mapper de #59 emite `space` vía `instanceof HexSpace` y que el repositorio reconstruye los records vía `LevelBuilder`. Sin cambios en código de producción.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 097 — test(back): cover the t-snowflake hex themed fixture in the curated-levels spec

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#60 (Task 10, desviación del plan): al correr la suite completa, `curated-levels.spec.ts` (spec preexistente, back#31/#53) falló 2 tests por el nuevo `t-snowflake` — el plan creó un catalog spec nuevo pero no previó que este spec más antiguo también enumera los fixtures `t-*.json` y los construía sin soporte de `space`.
**Herramienta de IA utilizada:** Claude Code (Opus 4.8); diagnóstico y fix manual del controlador (no subagente).
**Prompt o instrucción proporcionada:** > "Task 10: full suite green (npm test && test:e2e && lint:check)."
**Resultado obtenido:** Dos fallos y su causa: (1) el helper local `buildLevel` encadenaba `LevelBuilder` sin `withSpace/withSection/withSilhouette`, así que `t-snowflake` (hex enmascarado) se construía sobre `RectSpace` y su flecha `upRight` lanzaba `InvalidLevelException` — corregido delegando `buildLevel` en el `buildLevelFromFixture` compartido (Task 1), el camino de construcción canónico, eliminando de paso la duplicación (se quitaron los imports `LevelBuilder`/`LevelId` ya no usados). (2) El test "3 figuras temáticas front#68" hard-codeaba la lista exacta `[t-bunny,t-happy-face,t-heart]` y afirmaba `not.toHaveProperty('timeLimitSec')` para TODO temático — pero `t-snowflake` es un cuarto temático y, por decisión D6/D7 del plan, SÍ es cronometrado. Actualizado: `expectedIds` ahora incluye `t-snowflake`; el chequeo de "sin cronómetro" se acota a las figuras front#68 y se añade una aserción positiva de que `t-snowflake.timeLimitSec === 45`. El guardián de densidad ≥0.90 acepta `t-snowflake` sin cambios (teselado completo ⇒ cobertura 1.0). `npm test -- curated-levels.spec` → 70/70 verdes. **Nota de diseño para revisión:** este cambio flexibiliza el invariante previo "todo temático es sin cronómetro" — es intencional (el temático hex es cronometrado por diseño), no una regresión.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 098 — docs(back): document hex levels, seed space persistence and verify script

**Fecha:** 2026-07-18
**Tarea o problema abordado:** back#60 (Task 10): documentar en el README el catálogo hexagonal y cerrar la feature — 4 niveles hex sembrados (hex-01/02/03 libres + t-snowflake temático), la persistencia del descriptor `space` en el seed, la herramienta de autoría `scripts/verify-hex-level.ts` y el guardián de catálogo en CI.
**Herramienta de IA utilizada:** Claude Code (Opus 4.8), coordinando la ejecución subagéntica del plan.
**Prompt o instrucción proporcionada:** > "Ejecuta el plan back#60 task por task; tareas triviales sin revisor intermedio, revisión al final."
**Resultado obtenido:** `README.md` (modificado): la nota de `order`/`section` ahora menciona back#60 (el seed persiste `space` y ships de hex-01/02/03 + t-snowflake); la sección "Seeding levels" documenta los 4 fixtures hex, la línea de uso de `npx ts-node scripts/verify-hex-level.ts`, y el `level-catalog.spec.ts` como guardián sin-BD de los 22 boards. Cierre de back#60: Tasks 1-4 (módulo `level-fixture.ts` compartido + recableado del seed + catalog spec + script de autoría), Tasks 5-8 (autoría de los 4 niveles, convergidos con el verify script y certificados por el catalog spec: hex-01 R=3 11 flechas 50s, hex-02 R=4 18 flechas 80s, hex-03 R=5 27 flechas 120s, t-snowflake R=5 enmascarado 10 flechas teselado 45s), Task 9 (e2e del wire hex), Task 10 (docs). Desviación registrada en 097 (curated-levels spec). Suite final: unit 551/551, e2e 26/26, lint:check limpio para todos los archivos de back#60 (queda deuda de lint preexistente en 7 archivos ajenos, heredada de la base eb5026e — fuera de alcance). Los 4 niveles se autoraron en paralelo vía subagentes; los commits se hicieron secuencialmente para evitar carreras en el índice de git y en AI_HISTORY.
**Modificaciones realizadas por el equipo:** (completar manualmente)

## Entrada 099 — fix(back): seed hex level fixtures (regex drift in prisma/seed.ts)

**Fecha:** 2026-07-18
**Tarea o problema abordado:** El usuario reportó que "Modo hexagonal" en el front seguía mostrando "Aún no hay niveles hexagonales disponibles" pese a que back#58/#59/#60 (PRs #61/#62/#63) ya estaban mergeados a main. Debugging sistemático (superpowers:systematic-debugging): se descartaron migraciones (Level.data es una columna Json — back#60 no necesitó migración de esquema) y la conexión front↔back (docker compose sano, API_BASE_URL correcto, logs del back sirviendo otros niveles sin error). La consulta directa a Postgres mostró `section` con conteos `campaign=15, themed=4` y **cero** filas `hex`, mientras que `resolveSection`/`LevelBuilder` sí soportan `hex` end-to-end. Rastreando hacia atrás desde ahí: `prisma/seed.ts#loadFixtures()` filtra los archivos de `prisma/levels/` con un regex propio `^(level-\d+|t-[a-z0-9-]+)\.json$` que nunca incluyó el patrón `hex-\d+` — así que `hex-01/02/03.json` se descartan en silencio antes de validarse o insertarse. El guardián de CI (`level-catalog.spec.ts`) no lo detectó porque mantenía su PROPIA copia del regex, ya correcta, para una lista de archivos completamente separada (no ejercita `seed.ts`), dando una falsa sensación de cobertura.
**Herramienta de IA utilizada:** Claude Code (Sonnet 5), debugging y fix en el hilo principal (sin subagentes; alcance de un solo archivo).
**Prompt o instrucción proporcionada:** > "Por que aun no aparecen los niveles hexagonales, se hicieron las migraciones de prisma? esta bien conectado el front con el back? revisa todo lo que pueda estar pasando"
**Resultado obtenido:** Fix de raíz, no de síntoma: se extrajo `LEVEL_FIXTURE_FILENAME_PATTERN` (regex único, con `hex-\d+` incluido) a `level-fixture.ts` — la misma fuente DRY ya usada por `buildLevelFromFixture`/`fixtureToData`/`resolveSection` — y se hizo que tanto `prisma/seed.ts` como `level-catalog.spec.ts` importen esa única constante en vez de mantener regex duplicados que pueden volver a divergir. TDD: test RED en `level-fixture.spec.ts` (`LEVEL_FIXTURE_FILENAME_PATTERN` sin exportar → `TypeError`), luego GREEN tras exportar la constante (24/24 en el spec). Suite completa: 63 suites / 560 tests unitarios verdes, lint limpio en los 4 archivos tocados. Verificación end-to-end: `docker exec maze-back npx prisma db seed` sembró los 3 niveles hex faltantes (`Seed complete: 22 levels`, antes 19); `SELECT section, count(*) FROM "Level" GROUP BY section` confirma `hex=3`; `GET /levels` (puerto 3000, el mismo que consume el front) ahora devuelve `hex-01`, `hex-02`, `hex-03` con `section: "hex"`.
**Modificaciones realizadas por el equipo:** (completar manualmente)
