import { InvalidElapsedTimeException } from '../exceptions/invalid-elapsed-time.exception';

// VO inmutable: tiempo transcurrido de una partida, en segundos enteros no
// negativos. Factor del scoring (ADR 0001, decisión 7).
export class ElapsedTime {
  constructor(readonly seconds: number) {
    if (!Number.isInteger(seconds) || seconds < 0) {
      throw new InvalidElapsedTimeException(
        `ElapsedTime must be a non-negative integer of seconds, got ${seconds}`,
      );
    }
  }

  equals(other: ElapsedTime): boolean {
    return this.seconds === other.seconds;
  }
}
