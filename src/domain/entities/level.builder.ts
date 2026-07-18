import {
  Level,
  LevelPaint,
  LevelSection,
  LevelSilhouette,
} from './level.entity';
import { Arrow } from './arrow.entity';
import { ArrowFactory, ArrowPrimitives } from './arrow.factory';
import { LevelId } from '../value-objects/level-id.vo';
import { BoardSpace } from '../space/board-space';
import { RectSpace } from '../space/rect-space';
import { HexSpace } from '../space/hex-space';
import { HexMaskedSpace } from '../space/hex-masked-space';
import { Position } from '../value-objects/position.vo';
import { InvalidBoardSpaceException } from '../exceptions/invalid-board-space.exception';

// Descriptor de geometría del wire (ADR-0007 D4, back#59): forma cruda del
// campo opcional `space` del JSON de nivel. Solo 'hex' existe; ausente ⇒ rect.
export interface SpaceDescriptor {
  type: 'hex';
  radius: number;
}

// Builder (GoF): separa el ensamblado incremental de un Level desde JSON
// arrow-path crudo (Level.data) de su representación final. Re-funda el
// patrón pedido por ADR 0001 (decisión 4). Cada addArrow delega el parseo
// primitivo->dominio en ArrowFactory (Factory Method); build() delega las
// invariantes de tablero en el constructor de Level — el builder no las
// duplica, solo orquesta el orden de ensamblado. Reusable por el
// repositorio de niveles (back#5) y por el seed de niveles curados (back#10).
export class LevelBuilder {
  private cols?: number;
  private rows?: number;
  private timeLimitSec?: number;
  private section: LevelSection = 'campaign';
  private paint?: LevelPaint;
  private silhouette?: LevelSilhouette;
  private space?: SpaceDescriptor;
  private readonly arrows: Arrow[] = [];

  constructor(private readonly id: LevelId) {}

  withDimensions(cols: number, rows: number): this {
    this.cols = cols;
    this.rows = rows;
    return this;
  }

  withTimeLimit(timeLimitSec?: number): this {
    this.timeLimitSec = timeLimitSec;
    return this;
  }

  // ADR 0004 (back#31) + ADR-0007 (back#59): solo 'themed' y 'hex' literales
  // cambian de sección; cualquier otro valor (o ausencia) es campaña.
  withSection(section?: string): this {
    this.section =
      section === 'themed' || section === 'hex' ? section : 'campaign';
    return this;
  }

  // ADR-0007 (back#59): geometría explícita del wire. Ausente ⇒ rect desde
  // cols/rows (retrocompatibilidad total). Presente ⇒ cols/rows del wire se
  // IGNORAN (el bounding box lo deriva Level del espacio).
  withSpace(space?: SpaceDescriptor): this {
    this.space = space;
    return this;
  }

  // Portador opaco de Instrucciones de pintado: passthrough sin validación
  // (la verificación de forma es responsabilidad del seed, no del dominio).
  withPaint(paint?: LevelPaint): this {
    this.paint = paint;
    return this;
  }

  // Portador opaco de la máscara de silueta (back#53): passthrough sin
  // validación — mismo trato que withPaint. La verificación de forma es
  // responsabilidad del seed, no del dominio.
  withSilhouette(silhouette?: LevelSilhouette): this {
    this.silhouette = silhouette;
    return this;
  }

  addArrow(raw: ArrowPrimitives): this {
    this.arrows.push(ArrowFactory.create(raw));
    return this;
  }

  // Wire legítimamente 2D (ADR 0005): el builder es de los únicos módulos
  // que conocen RectSpace en concreto — lo construye desde cols/rows del
  // JSON. Las invariantes de dimensiones viven en RectSpace; las de tablero,
  // en Level. El builder sigue sin duplicar ninguna.
  build(): Level {
    // timeLimitSec ahora es obligatorio en Level (ADR 0006, back#A2). Cuando
    // el llamador (seed de fixtures sin límite curado, o el mapper Prisma al
    // reconstruir datos legados pre-regeneración) no lo fijó vía
    // withTimeLimit, se asigna el provisional max(30, nº flechas * 6) solo
    // para satisfacer la invariante — los niveles reciben valores curados
    // más adelante.
    const timeLimitSec =
      this.timeLimitSec ?? Math.max(30, this.arrows.length * 6);
    return new Level(
      this.id,
      this.buildSpace(),
      this.arrows,
      timeLimitSec,
      this.section,
      this.paint,
      this.silhouette,
    );
  }

  // Único punto (junto al propio wire) que instancia espacios concretos
  // (ADR 0005/0007). hex + silhouette ⇒ máscara con activas = unión de las
  // regiones (en hex la silueta ES frontera jugable — asimetría consciente
  // con rect+themed, donde la silueta es solo visual; ver CONTEXT.md).
  private buildSpace(): BoardSpace {
    if (this.space === undefined) {
      return new RectSpace(this.cols as number, this.rows as number);
    }
    if (this.space.type !== 'hex') {
      throw new InvalidBoardSpaceException(
        `Unknown space type '${String(this.space.type)}' (allowed: hex)`,
      );
    }
    if (this.silhouette !== undefined) {
      const active = Object.values(this.silhouette).flatMap((cells) =>
        cells.map(([row, col]) => new Position(row, col)),
      );
      return new HexMaskedSpace(this.space.radius, active);
    }
    return new HexSpace(this.space.radius);
  }
}
