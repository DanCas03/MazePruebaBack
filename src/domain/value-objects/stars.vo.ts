import { InvalidStarsException } from '../exceptions/invalid-stars.exception';

// VO inmutable: calificación en estrellas de una partida (ADR 0001, decisión 7).
// El rango 1..3 es una invariante de dominio; ningún ScoreEntry existe fuera de él.
export class Stars {
  static readonly MIN = 1;
  static readonly MAX = 3;

  constructor(readonly value: number) {
    if (!Number.isInteger(value) || value < Stars.MIN || value > Stars.MAX) {
      throw new InvalidStarsException(
        `Stars must be an integer between ${Stars.MIN} and ${Stars.MAX}, got ${value}`,
      );
    }
  }

  equals(other: Stars): boolean {
    return this.value === other.value;
  }

  // Umbrales de calificación (misma regla que venía aplicando el cliente;
  // desde ADR 0006 la autoridad es este VO).
  static readonly PERFECT_MOVE_TOLERANCE = 2;
  static readonly TWO_STAR_MAX_COLLISIONS = 2;
  static readonly TWO_STAR_MOVE_TOLERANCE = 6;

  static rate(args: {
    moves: number;
    optimalMoves: number;
    collisions: number;
  }): Stars {
    const extra = Math.max(args.moves - args.optimalMoves, 0);
    if (args.collisions === 0 && extra <= Stars.PERFECT_MOVE_TOLERANCE) {
      return new Stars(3);
    }
    if (
      args.collisions <= Stars.TWO_STAR_MAX_COLLISIONS &&
      extra <= Stars.TWO_STAR_MOVE_TOLERANCE
    ) {
      return new Stars(2);
    }
    return new Stars(1);
  }
}
