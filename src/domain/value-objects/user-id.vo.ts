import { InvalidUuidException } from '../exceptions/invalid-uuid.exception';

/**
 * Value Object para el identificador de usuario (UUID).
 *
 * DDD: garantiza que un id de usuario siempre tenga forma de UUID válido,
 * evitando confundirlo con cualquier otro `string` del sistema.
 */
export class UserId {
  private static readonly UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private constructor(public readonly value: string) {}

  static of(raw: string): UserId {
    if (!raw || !UserId.UUID_PATTERN.test(raw)) {
      throw new InvalidUuidException(raw);
    }
    return new UserId(raw);
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
