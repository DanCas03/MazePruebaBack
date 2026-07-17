// Chequeo de consistencia BARATO de la máscara de silueta temática en la
// frontera del seed (ADR 0004, back#53): el backend NO valida semántica
// visual — solo forma básica, para no sembrar jamás metadata rota. El
// dominio trata silhouette como dato opaco (LevelSilhouette); esta es la
// única verificación. Espejo de level-paint.validator.ts.
//
// Reglas (y nada más):
//   1. silhouette ausente => ok (campaña).
//   2. Presente => el objeto no puede estar vacío.
//   3. Toda región (clave) referencia una clave existente de palette.
//   4. Toda celda es un par entero [row, col] dentro de cols x rows.
//   5. Sin celdas duplicadas dentro de una misma región.
//   6. Sin solape de celdas entre regiones distintas.
//   7. Toda celda de toda flecha pertenece a la unión de la silueta.

// Subconjunto estructural del fixture que interesa al chequeo de silueta;
// desacopla el validador de la forma completa del LevelFixture del seed.
export interface SilhouetteFixtureShape {
  levelId: string;
  cols: number;
  rows: number;
  palette?: Record<string, string>;
  silhouette?: Record<string, number[][]>;
  arrows: { id: string; cells: number[][] }[];
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function isIntegerPair(cell: unknown): cell is [number, number] {
  return (
    Array.isArray(cell) &&
    cell.length === 2 &&
    Number.isInteger(cell[0]) &&
    Number.isInteger(cell[1])
  );
}

export function validateLevelSilhouette(fixture: SilhouetteFixtureShape): void {
  if (fixture.silhouette === undefined) {
    return;
  }

  const regions = Object.entries(fixture.silhouette);
  if (regions.length === 0) {
    throw new Error(
      `Level ${fixture.levelId}: silhouette is present but empty — ` +
        `refusing to seed.`,
    );
  }

  const union = new Set<string>();

  for (const [role, cells] of regions) {
    if (
      fixture.palette === undefined ||
      !Object.prototype.hasOwnProperty.call(fixture.palette, role)
    ) {
      throw new Error(
        `Level ${fixture.levelId}: silhouette region '${role}' references ` +
          `a role missing from the palette — refusing to seed.`,
      );
    }

    const seenInRegion = new Set<string>();
    for (const [index, cell] of cells.entries()) {
      if (!isIntegerPair(cell)) {
        throw new Error(
          `Level ${fixture.levelId}: silhouette region '${role}' cell[${index}] ` +
            `must be an integer pair [row, col] — refusing to seed.`,
        );
      }

      const [row, col] = cell;
      if (row < 0 || row >= fixture.rows || col < 0 || col >= fixture.cols) {
        throw new Error(
          `Level ${fixture.levelId}: silhouette region '${role}' cell[${index}] ` +
            `[${row}, ${col}] is out of bounds for a ${fixture.cols}x${fixture.rows} ` +
            `board — refusing to seed.`,
        );
      }

      const key = cellKey(row, col);
      if (seenInRegion.has(key)) {
        throw new Error(
          `Level ${fixture.levelId}: silhouette region '${role}' has a duplicate ` +
            `cell [${row}, ${col}] — refusing to seed.`,
        );
      }
      seenInRegion.add(key);

      if (union.has(key)) {
        throw new Error(
          `Level ${fixture.levelId}: silhouette region '${role}' cell [${row}, ${col}] ` +
            `overlaps another region — refusing to seed.`,
        );
      }
      union.add(key);
    }
  }

  for (const arrow of fixture.arrows) {
    for (const [index, cell] of arrow.cells.entries()) {
      const [row, col] = cell;
      if (!union.has(cellKey(row, col))) {
        throw new Error(
          `Level ${fixture.levelId}: arrow '${arrow.id}' cell[${index}] ` +
            `[${row}, ${col}] falls outside the silhouette union — refusing to seed.`,
        );
      }
    }
  }
}
