import { InvalidMoveCountException } from '../exceptions/invalid-move-count.exception';

// VO inmutable: cantidad de movimientos usados para resolver un nivel.
// Entero no negativo (0 movimientos es teóricamente válido: nivel vacío).
export class MoveCount {
  constructor(readonly value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new InvalidMoveCountException(
        `MoveCount must be a non-negative integer, got ${value}`,
      );
    }
  }

  equals(other: MoveCount): boolean {
    return this.value === other.value;
  }
}
