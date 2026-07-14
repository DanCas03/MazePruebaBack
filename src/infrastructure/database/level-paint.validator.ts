// Chequeo de consistencia BARATO de las Instrucciones de pintado en la
// frontera del seed (ADR 0004, back#31): el backend NO valida semántica
// visual — solo forma básica, para no sembrar jamás metadata rota. El
// dominio trata paint como dato opaco; esta es la única verificación.
//
// Reglas (y nada más):
//   1. Todo paintRole referencia una clave existente de palette.
//   2. Todo valor de palette tiene forma hex #RRGGBB.
//   3. paintRole sin palette en el fixture => error.

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

// Subconjunto estructural del fixture que interesa al chequeo de pintado;
// desacopla el validador de la forma completa del LevelFixture del seed.
export interface PaintFixtureShape {
  levelId: string;
  palette?: Record<string, string>;
  arrows: { id: string; paintRole?: string }[];
}

export function validateLevelPaint(fixture: PaintFixtureShape): void {
  const rolesInUse = fixture.arrows.filter(
    (arrow) => arrow.paintRole !== undefined,
  );

  if (fixture.palette === undefined) {
    if (rolesInUse.length > 0) {
      throw new Error(
        `Level ${fixture.levelId}: arrow '${rolesInUse[0].id}' has a ` +
          `paintRole but the fixture has no palette — refusing to seed.`,
      );
    }
    return;
  }

  for (const [role, hex] of Object.entries(fixture.palette)) {
    if (!HEX_COLOR.test(hex)) {
      throw new Error(
        `Level ${fixture.levelId}: palette role '${role}' has malformed ` +
          `color '${hex}' (expected #RRGGBB) — refusing to seed.`,
      );
    }
  }

  for (const arrow of rolesInUse) {
    if (!(arrow.paintRole! in fixture.palette)) {
      throw new Error(
        `Level ${fixture.levelId}: arrow '${arrow.id}' references ` +
          `paintRole '${arrow.paintRole}' missing from the palette — ` +
          `refusing to seed.`,
      );
    }
  }
}
