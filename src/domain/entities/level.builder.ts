import { Level, LevelPaint, LevelSection } from './level.entity';
import { Arrow } from './arrow.entity';
import { ArrowFactory, ArrowPrimitives } from './arrow.factory';
import { LevelId } from '../value-objects/level-id.vo';
import { RectSpace } from '../space/rect-space';

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

  // ADR 0004 (back#31): solo 'themed' literal cambia de sección; cualquier
  // otro valor (o ausencia) es campaña — retro-compat con datos viejos que
  // no traen la columna.
  withSection(section?: string): this {
    this.section = section === 'themed' ? 'themed' : 'campaign';
    return this;
  }

  // Portador opaco de Instrucciones de pintado: passthrough sin validación
  // (la verificación de forma es responsabilidad del seed, no del dominio).
  withPaint(paint?: LevelPaint): this {
    this.paint = paint;
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
    const timeLimitSec = this.timeLimitSec ?? Math.max(30, this.arrows.length * 6);
    return new Level(
      this.id,
      new RectSpace(this.cols as number, this.rows as number),
      this.arrows,
      timeLimitSec,
      this.section,
      this.paint,
    );
  }
}
