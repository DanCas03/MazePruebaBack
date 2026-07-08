import { InvalidScoreException } from '../exceptions/invalid-score.exception';

// VO inmutable: puntaje numérico de una partida. Un entero no negativo
// (0 es válido: una partida puede resolverse con el peor puntaje posible).
export class Score {
  constructor(readonly value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new InvalidScoreException(
        `Score must be a non-negative integer, got ${value}`,
      );
    }
  }

  equals(other: Score): boolean {
    return this.value === other.value;
  }
}
