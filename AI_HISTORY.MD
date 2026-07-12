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
**Modificaciones realizadas por el equipo:** (completar manualmente)
