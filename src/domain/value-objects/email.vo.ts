import { InvalidEmailException } from '../exceptions/invalid-email.exception';

/**
 * Value Object para un email validado.
 *
 * DDD: una vez construido, el resto del sistema confía en que el formato es
 * correcto sin re-validar. Sustituye el primitive obsession con `string`.
 */
export class Email {
  private static readonly PATTERN = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;

  private constructor(public readonly value: string) {}

  static of(raw: string): Email {
    const normalized = (raw ?? '').trim().toLowerCase();
    if (!Email.PATTERN.test(normalized)) {
      throw new InvalidEmailException(raw);
    }
    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
