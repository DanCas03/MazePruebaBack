# Arrow Maze — API (NestJS)

Contexto del **servidor**: fuente autoritativa de los niveles, gestiona cuentas y sesiones,
recibe el progreso/puntajes del cliente y publica el ranking. **No corre la mecánica de
juego** — solo guarda y sirve definiciones de nivel como datos.

## Language

### Niveles

**Level** (Nivel):
Definición de nivel persistida como JSON _arrow-path_ (`{ cols, rows, arrows: [...] }`),
identificada por `LevelId`. El backend es la fuente autoritativa; se pueden añadir/actualizar
niveles sin actualizar la app.
_Avoid_: grid de celdas, tablero de celdas, mapa.

**Arrow** (Flecha, como dato):
En el backend una flecha es **solo datos**: `cells` (camino) + `headDir`. No tiene
comportamiento de juego (eso vive en el cliente).
_Avoid_: ArrowCell, celda-flecha, entidad con `canBeTraversed`.

### Cuenta y sesión

**User** (Usuario):
Cuenta identificada por `UserId`, con `Email` y `HashedPassword`.

**Email**:
Correo validado por regex; igualdad case-insensitive.
_Avoid_: login, username.

**HashedPassword**:
Contraseña ya hasheada; valor opaco (no se compara ni valida formato de hash).
_Avoid_: password, clave en claro.

**Token** (JWT):
Credencial de sesión firmada que el cliente envía en cada llamada autenticada. Expiración
larga para soportar la sesión persistente del cliente.
_Avoid_: cookie, api-key.

### Puntajes y progreso

**ScoreEntry**:
Un puntaje que un `User` envía para un `Level` (score numérico + estrellas + movimientos/tiempo).
_Avoid_: record, resultado.

**Leaderboard** (Ranking):
Los mejores `ScoreEntry` por `Level`.

**Progress** (Progreso):
Progreso del jugador (niveles completados + mejores scores) que el cliente sincroniza con el
servidor.
_Avoid_: savegame, estado.

### Vocabulario retirado (no usar)

`ICell`, `WallCell`, `EmptyCell`, `ExitCell`, `CellType`, `CellFactory`, `ICell[][]`, grilla.
El modelo de grilla del dominio fue retirado en favor del formato _arrow-path_ (ver
`docs/adr/0001`). El patrón **Factory Method** se re-funda en `ArrowFactory`; **Builder** y
**Strategy** entran con la autoría/fuente de niveles.
