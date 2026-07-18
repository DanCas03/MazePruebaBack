# back#60 — Seed de 4 niveles hexagonales + cableado hex del pipeline de seed

**Fecha:** 2026-07-18
**Estado:** Diseño aprobado (brainstorming). Pendiente: `/grilling` → `writing-plans` → ejecución.
**Issue:** MazePruebaBack #60 — `feat(levels): seed 3 niveles hexagonales R=3/4/5 + 1 temático hexagonal`
**Rama:** `feat/60-hex-levels` (apilada sobre `feat/59-hex-space` / PR #62)
**Depende de:** #59 (HexSpace, HexMaskedSpace, descriptor wire `space`, solver hex-agnóstico). ADR-0007.

---

## 1. Contexto y problema

El modo hexagonal (ADR-0007) necesita contenido. #59 dejó el dominio listo (`HexSpace`, `HexMaskedSpace`, el descriptor wire `{type:'hex',radius:N}`, y el `LevelSolver` que ya funciona sobre hex sin cambios). Pero **no existe ningún nivel hexagonal**, y —hallazgo clave del mapeo de #59— **el pipeline de seed todavía no cablea hex**:

- `LevelFixture` (en `prisma/seed.ts`) no tiene campo `space`.
- `validate()` construye el `Level` solo con `.withDimensions().withTimeLimit().addArrow()` — sin `.withSpace()`, `.withSilhouette()` ni `.withSection()`. Un fixture hex se validaría contra `RectSpace` y sus `headDir` diagonales lanzarían `InvalidLevelException`.
- `toData()` no copia `space` → round-trip como rect.
- El mapeo de sección es `fixture.section === 'themed' ? 'themed' : 'campaign'` → `'hex'` colapsa a `'campaign'`.
- `level-silhouette.validator` usa `cols`/`rows` para su bounds-check.

Por tanto #60 = **contenido (4 JSON) + glue de seed + una herramienta de autoría/verificación**, no solo JSON.

## 2. Alcance

**Dentro:**
1. Autoría de 4 niveles: `hex-01`, `hex-02`, `hex-03` (modo hex, R=3/4/5) + `t-snowflake` (temático hex).
2. Cablear hex en el pipeline de seed (fixture interface, `validate`, `toData`, mapeo de sección).
3. Script puntual `scripts/verify-hex-level.ts` para autorizar y verificar niveles a mano (no producto).
4. Tests AAA de todo lo anterior; registro `AI_HISTORY.MD`; actualización `README.md`.

**Fuera:** UI del front (pantalla del modo, render), generador procedimental hex (el módulo «Generar nivel» sigue rect-only), más de 1 temático hex.

## 3. Decisiones cerradas (brainstorming 2026-07-18)

| # | Decisión | Valor |
|---|---|---|
| D1 | Figura del temático | **Copo de nieve** (simetría 6, la figura icónicamente hex) |
| D2 | Radio del temático | **R=5** (hexágono base 91 celdas, brazos largos con ramitas) |
| D3 | Paleta / paintRole | **2 roles**: `core` (centro, `#3B82F6` azul) + `snow` (brazos, `#E8F4FF` hielo) |
| D4 | Naming | `hex-01/02/03` (R=3/4/5) + `t-snowflake` (coherente con `t-heart`/`t-bunny`) |
| D5 | Ramp de dificultad | **Densidad + profundidad de dependencia**: 6 direcciones en los tres, fill y enredo del orden de salida crecen con R (viable a bajo coste porque el solver verifica resolubilidad) |
| D6 | Calibración `timeLimitSec` | **Presupuesto fijo por tap**: `round5(longitudSolución × 4.5)`, floor 30s. `k=4.5` derivado de la ratio real de campaña (rango 4.0–5.6, media 4.5) |
| D7 | Herramienta de autoría | **Script standalone** `scripts/verify-hex-level.ts` (build+solve sin DB, imprime longitud + render ASCII) |

## 4. Los 3 niveles libres — `hex-01/02/03`

Forma del JSON (confirmada contra el código de #59):

```jsonc
{
  "levelId": "hex-01",
  "section": "hex",
  "cols": 7, "rows": 7,          // 2R+1 (R=3 → 7); ignorados por la geometría, presentes para el validator
  "space": { "type": "hex", "radius": 3 },
  "timeLimitSec": 45,            // = round5(len × 4.5), fijado tras verificar con el solver
  "arrows": [
    { "id": "arrow-0", "headDir": "upRight", "cells": [[3,3],[2,3]] }
    // headDir ∈ {up,down,upRight,downRight,upLeft,downLeft}; cells [row,col]; multi-celda
  ]
}
```

- `HexSpace` lleno (todo el hexágono jugable; sin `silhouette`).
- Las **6 direcciones hex** presentes en los tres niveles; longitudes de flecha variadas.
- Densidad y profundidad de dependencia crecen con R. Objetivos de calibración/densidad:

| Nivel | R | Celdas hex (3R²+3R+1) | Flechas objetivo | `timeLimitSec` | Fill aprox |
|---|---|---|---|---|---|
| hex-01 | 3 | 37 | ~10 | 45s | ~68% |
| hex-02 | 4 | 61 | ~17 | 75s | ~75% |
| hex-03 | 5 | 91 | ~27 | 120s | ~83% |

Los objetivos de flechas salen de invertir la fórmula de calibración (`45/4.5=10`, `75/4.5≈17`, `120/4.5≈27`); son guía de autoría, no cuota rígida. El `timeLimitSec` final se fija con la longitud de solución real del solver (`round5(len×4.5)`).

## 5. El temático — `t-snowflake`

```jsonc
{
  "levelId": "t-snowflake",
  "section": "themed",
  "cols": 11, "rows": 11,        // 2R+1 con R=5
  "space": { "type": "hex", "radius": 5 },
  "palette": { "core": "#3B82F6", "snow": "#E8F4FF" },
  "timeLimitSec": <round5(len × 4.5)>,   // ver §7 (punto abierto)
  "arrows": [ { "id": "...", "headDir": "...", "cells": [[r,c],...], "paintRole": "core" | "snow" } ],
  "silhouette": { "core": [[r,c],...], "snow": [[r,c],...] }
}
```

- `HexMaskedSpace`: la **silueta es la frontera jugable** (asimetría consciente con rect+themed, donde la silueta es solo visual — ADR-0007 / decisión de #59). Las celdas activas = unión de las regiones de la silueta.
- **Estructura del copo**: centro + 6 brazos radiales a lo largo de los 6 ejes hex (longitud ~5) con ramitas laterales para el aspecto dendrítico; **simétrico bajo rotación de 60°**.
- Las flechas **teselan el copo por completo**: `unión(silhouette) == unión(cells de las flechas)` (mismo principio que `t-heart`). Celdas del centro → `paintRole:"core"`; celdas de los brazos → `paintRole:"snow"`. `silhouette.core` y `silhouette.snow` reflejan esa partición.
- Solubilidad garantizada por orden de pelado desde el borde (arrows del contorno apuntando hacia afuera salen primero); el solver lo certifica en tiempo de seed. Precedente: `t-heart` está totalmente teselado y es resoluble.
- Regla de autoría: `cols/rows = 2R+1 = 11` para que el `level-silhouette.validator` (que usa esos bounds) no misfire.

## 6. Pegamento de seed (`prisma/seed.ts` + validator)

Cambios mínimos, con la regla dura de **no-regresión rect**:

1. `LevelFixture`: añadir `space?: SpaceDescriptor`.
2. `validate(fixture)`: encadenar `.withSpace(fixture.space).withSilhouette(fixture.silhouette).withSection(fixture.section)` en el builder (replicando el `buildLevel` del `level-solver.spec.ts`).
3. `toData(fixture)`: copiar `space` a `Level.data` cuando esté presente.
4. Mapeo de sección: manejar `'hex'` explícitamente (`fixture.section ?? 'campaign'`, respetando `'themed'`/`'hex'`).
5. `level-silhouette.validator`: verificar que su bounds-check funciona con `cols/rows = 2R+1` (los fixtures hex los fijan a la caja); ajustar si misfire.

**Invariante de no-regresión (guard):** para fixtures rect (sin `space`), el output de `toData` es byte-idéntico al actual → los 18 niveles existentes se re-seedean sin diff.

## 7. Calibración de `timeLimitSec`

- Fórmula: `timeLimitSec = round5(solución.length × 4.5)`, floor 30s.
- `k = 4.5 s/tap` derivado de la campaña (ratio observada 4.0–5.6, media 4.52; los niveles grandes convergen a ~4.0).
- Como **todas** las flechas deben salir para limpiar el tablero, `solver.solve(level).length === nº de flechas`; la longitud de solución es un proxy directo del tiempo (nº de taps).
- Aplicada a los 3 libres. **Punto abierto (para grilling):** al `t-snowflake` (sección `themed`) — ¿tiempo explícito con la misma fórmula (consistente si el front lo surface en modo hex) o seguir la convención themed (sin `timeLimitSec` explícito → el builder asigna provisional `max(30, arrows*6)`)? Default propuesto: **tiempo explícito**.

## 8. Script de verificación — `scripts/verify-hex-level.ts`

Herramienta puntual (no producto), sancionada por el brief:
- Entrada: ruta a un JSON candidato.
- Construye el `Level` vía `LevelBuilder` (`.withDimensions().withSpace().withSilhouette().withTimeLimit()` + `addArrow`).
- Corre `new LevelSolver().solve(level)`.
- Imprime: resoluble sí/no; **longitud de solución**; `timeLimitSec` sugerido (`round5(len×4.5)`); y un **render ASCII del hexágono** (celdas activas + id/dirección de cada flecha) para iterar la autoría a mano.
- **No toca la DB.** Reutiliza el mismo camino de construcción que el seed y los specs.

## 9. Tests (AAA)

- **Unit seed**: fixture con `space` → construye `HexSpace` (sin silueta) / `HexMaskedSpace` (con silueta); `toData` conserva `space` en round-trip; sección `'hex'` se persiste; **fixture rect sin `space` → `toData` byte-idéntico** (guard de regresión).
- **Unit validator**: `level-silhouette.validator` con bounds `2R+1` no misfire sobre un fixture hex.
- **Script**: verificación de que `verify-hex-level.ts` reporta correctamente resoluble/insoluble sobre un par de fixtures conocidos.
- **e2e**: la API lista y sirve los 4 niveles con su descriptor `space` correcto; los de sección `hex` **no** aparecen en la campaña ordenada.
- **Idempotencia**: reseed completo deja los 18 niveles previos byte a byte iguales.
- **Solubilidad**: los 4 nuevos pasan `isSolvable` en tiempo de seed (ya lo fuerza el pipeline `fixtures.forEach(validate)`).

## 10. Criterios de aceptación (del Agent Brief)

- [ ] `hex-01/02/03` con radios 3/4/5, sección `hex`, sin `order`, timed; el solver los certifica resolubles en seed.
- [ ] El temático hexagonal valida sus invariantes (silueta no vacía, toda celda de toda flecha dentro de la unión de regiones) y es resoluble.
- [ ] Reseed completo idempotente: los niveles previos quedan byte a byte iguales.
- [ ] e2e: la API lista y sirve los 4 niveles con su `space` correcto; los de sección `hex` no aparecen en la campaña ordenada.
- [ ] Suite completa verde.

## 11. Proceso pendiente

1. **`/grilling`** (junto a `/domain-modeling`) sobre este spec — estresar: forma exacta del copo, punto abierto de §7, regla de teselado completo del temático, coste real de autoría a mano de la densidad objetivo.
2. **`superpowers:writing-plans`** — plan de ejecución por tasks (glue de seed → script → autoría verificada → tests).
3. Ejecución siguiendo el plan; tests AAA, `AI_HISTORY.MD` (verificar número contiguo — main iba en 087 en #59), commits por fragmento (Conventional Commits), `README.md` si cambia funcionalidad pública.
