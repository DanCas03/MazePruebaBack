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

  // Constantes de la fórmula multiplicativa (ADR 0006). Nombradas para poder
  // tunearlas sin cambiar la estructura; el front duplica la fórmula solo como
  // preview y puede divergir sin romper nada (el canónico es este).
  static readonly BASE = 10000;
  static readonly MOVE_EXPONENT = 2;
  static readonly COLLISION_FACTOR = 0.8;
  static readonly PAR_RATIO = 0.5; // par = timeLimitSec × PAR_RATIO
  static readonly MIN_WIN_SCORE = 100; // ganar siempre suma algo

  // Deriva el puntaje canónico de una partida ganada (ADR 0006): multiplicativo
  // para que rápido-y-perfecto se separe con claridad de "pasar con lo mínimo".
  static fromRun(args: {
    moves: number;
    optimalMoves: number;
    collisions: number;
    timeSeconds: number;
    timeLimitSec: number;
  }): Score {
    const optimal = Math.max(args.optimalMoves, 1);
    const moves = Math.max(args.moves, optimal); // menos que el óptimo no da crédito
    const collisions = Math.max(args.collisions, 0);
    const seconds = Math.max(args.timeSeconds, 0);

    const precision =
      Math.pow(optimal / moves, Score.MOVE_EXPONENT) *
      Math.pow(Score.COLLISION_FACTOR, collisions);
    const par = args.timeLimitSec * Score.PAR_RATIO;
    const timeFactor = Math.pow(2, -seconds / par);

    const raw = Math.round(Score.BASE * precision * timeFactor);
    return new Score(Math.max(raw, Score.MIN_WIN_SCORE));
  }
}
