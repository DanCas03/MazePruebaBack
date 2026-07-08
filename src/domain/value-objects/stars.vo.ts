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
}
