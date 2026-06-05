/**
 * Value Object que identifica un nivel.
 *
 * DDD: evita el primitive obsession con `number` en repositorios, casos de uso
 * y controladores. Se construye con `of()` validando el invariante (entero
 * positivo). El rango inválido es un error de programación, por lo que se usa
 * `RangeError` estándar.
 */
export class LevelId {
  private constructor(public readonly value: number) {}

  static of(n: number): LevelId {
    if (!Number.isInteger(n) || n <= 0) {
      throw new RangeError(`LevelId inválido: ${n}. Debe ser un entero positivo.`);
    }
    return new LevelId(n);
  }

  equals(other: LevelId): boolean {
    return this.value === other.value;
  }
}
