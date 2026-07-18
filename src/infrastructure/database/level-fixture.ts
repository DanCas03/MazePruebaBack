import { Prisma } from '@prisma/client';
import {
  Level,
  LevelSection,
  LevelSilhouette,
} from '../../domain/entities/level.entity';
import {
  LevelBuilder,
  SpaceDescriptor,
} from '../../domain/entities/level.builder';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import type { ArrowPrimitives } from '../../domain/entities/arrow.factory';

// Superset declarativo de un fixture de nivel (prisma/levels/*.json): las
// columnas de tabla (levelId, order, section) izadas junto a Level.data.
// back#60 (ADR-0007): `space` opcional describe la geometría hex; ausente ⇒ rect.
export interface LevelFixture {
  levelId: string;
  order?: number;
  section?: string;
  cols: number;
  rows: number;
  timeLimitSec?: number;
  space?: SpaceDescriptor;
  palette?: Record<string, string>;
  silhouette?: Record<string, number[][]>;
  arrows: (ArrowPrimitives & { paintRole?: string })[];
}

// Camino ÚNICO fixture -> Level (DRY): lo comparten el seed (validación de
// resolubilidad), el catalog spec y el script de autoría. Incluye space y
// silhouette para construir sobre la geometría correcta (HexSpace /
// HexMaskedSpace); sin ellos un fixture hex caería en RectSpace y sus headDir
// diagonales lanzarían InvalidLevelException.
export function buildLevelFromFixture(fixture: LevelFixture): Level {
  const builder = new LevelBuilder(new LevelId(fixture.levelId))
    .withDimensions(fixture.cols, fixture.rows)
    .withSpace(fixture.space)
    .withSection(fixture.section)
    // number[][] del JSON -> tuplas readonly del dominio (idénticos en runtime).
    .withSilhouette(fixture.silhouette as unknown as LevelSilhouette | undefined)
    .withTimeLimit(fixture.timeLimitSec);
  fixture.arrows.forEach((arrow) => builder.addArrow(arrow));
  return builder.build();
}

// Forma persistida en Level.data. back#60: incluye `space` cuando está
// presente. Para fixtures rect (space ausente) el output es BYTE-IDÉNTICO al de
// antes de back#60 — invariante de no-regresión. Excluye levelId/order/section
// (son columnas de tabla).
export function fixtureToData(fixture: LevelFixture): Prisma.InputJsonValue {
  return {
    cols: fixture.cols,
    rows: fixture.rows,
    ...(fixture.timeLimitSec !== undefined
      ? { timeLimitSec: fixture.timeLimitSec }
      : {}),
    ...(fixture.space !== undefined ? { space: fixture.space } : {}),
    ...(fixture.palette !== undefined ? { palette: fixture.palette } : {}),
    ...(fixture.silhouette !== undefined
      ? { silhouette: fixture.silhouette }
      : {}),
    // Los fixtures son JSON por construcción; el cast salva solo la fricción
    // de tipos entre la forma declarativa (space/silhouette con literales
    // TS) y el tipo estructural InputJsonValue de Prisma.
    arrows: fixture.arrows as unknown as Prisma.InputJsonArray,
  } as unknown as Prisma.InputJsonValue;
}

// Sección de catálogo: 'themed'/'hex' literales; cualquier otro valor (o
// ausencia) ⇒ 'campaign'. Espeja LevelBuilder.withSection.
export function resolveSection(fixture: LevelFixture): LevelSection {
  return fixture.section === 'themed' || fixture.section === 'hex'
    ? fixture.section
    : 'campaign';
}

// Presupuesto de tiempo (back#60 D6): mismo s/tap que la campaña (~4.5),
// redondeado a 5s, piso 30s. longitud de solución == nº de flechas.
export function suggestTimeLimitSec(solutionLength: number): number {
  return Math.max(30, Math.round((solutionLength * 4.5) / 5) * 5);
}
