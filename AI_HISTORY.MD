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

## Entrada 016 — back#7 (fragmento 1/3): dominio ScoreEntry

**Fecha:** 2026-07-08
**Tarea o problema abordado:** Issue back#7 — modelar el dominio de puntajes que alimenta el Leaderboard (ADR 0001, decisión 7). Primer fragmento: entidad `ScoreEntry` y sus Value Objects. Decisiones de diseño: (1) cada atributo escalar del puntaje es un VO con su invariante en el constructor (consistente con `Position`/`Email`/`LevelId`), no primitivos sueltos; (2) `Stars` acota el rango 1..3 como invariante de dominio; (3) el `score`/`stars` los computa el cliente (front#12) y el backend solo los valida y almacena — no se recomputa en el back; (4) se incluye `ScoreEntryId` como VO por simetría con `UserId`/`LevelId` (toda identidad es concepto de dominio); (5) `createdAt: Date` en la entidad para permitir desempates estables en el leaderboard (Date es builtin, no rompe la pureza del dominio). Numeración: la entrada 015 corresponde a back#2 (rama `feat/#2`, aún sin mergear); back#7 se ramificó desde `main` para ser independiente.
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
