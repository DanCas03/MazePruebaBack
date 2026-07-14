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
