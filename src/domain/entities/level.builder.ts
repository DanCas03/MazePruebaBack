import { Level } from './level.entity';
import { Arrow } from './arrow.entity';
import { ArrowFactory, ArrowPrimitives } from './arrow.factory';
import { LevelId } from '../value-objects/level-id.vo';

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

  addArrow(raw: ArrowPrimitives): this {
    this.arrows.push(ArrowFactory.create(raw));
    return this;
  }

  build(): Level {
    return new Level(
      this.id,
      this.cols as number,
      this.rows as number,
      this.arrows,
      this.timeLimitSec,
    );
  }
}
