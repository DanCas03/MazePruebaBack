import { InvalidDirectionException } from '../exceptions/invalid-direction.exception';

export enum DirectionValue {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

/**
 * Value Object para la dirección de una flecha.
 *
 * DDD: encapsula su invariante (sólo valores del enum) y su comportamiento
 * (rotación horaria). El parseo desde texto externo se centraliza en `of()`.
 */
export class Direction {
  private static readonly CLOCKWISE: Record<DirectionValue, DirectionValue> = {
    [DirectionValue.UP]: DirectionValue.RIGHT,
    [DirectionValue.RIGHT]: DirectionValue.DOWN,
    [DirectionValue.DOWN]: DirectionValue.LEFT,
    [DirectionValue.LEFT]: DirectionValue.UP,
  };

  private constructor(public readonly value: DirectionValue) {}

  static of(raw: string): Direction {
    const upper = (raw ?? '').toUpperCase();
    if (!Object.values(DirectionValue).includes(upper as DirectionValue)) {
      throw new InvalidDirectionException(raw);
    }
    return new Direction(upper as DirectionValue);
  }

  /** Devuelve una NUEVA dirección girada 90° en sentido horario (inmutable). */
  rotateClockwise(): Direction {
    return new Direction(Direction.CLOCKWISE[this.value]);
  }

  equals(other: Direction): boolean {
    return this.value === other.value;
  }
}
