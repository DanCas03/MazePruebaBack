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
