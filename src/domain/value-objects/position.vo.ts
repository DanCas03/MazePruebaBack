import { InvalidPositionException } from '../exceptions/invalid-position.exception';

/**
 * Value Object inmutable que representa una coordenada en la cuadrícula.
 *
 * DDD: constructor privado + factory `of()` para garantizar que NUNCA exista
 * una posición en estado inválido (invariante: enteros no negativos). Se compara
 * por valor con `equals()`. Sustituye el uso de un objeto `{ x, y }` suelto.
 */
export class Position {
  private constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  static of(x: number, y: number): Position {
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) {
      throw new InvalidPositionException(x, y);
    }
    return new Position(x, y);
  }

  equals(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }
}
