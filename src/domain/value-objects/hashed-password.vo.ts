/**
 * Value Object que envuelve una contraseña YA hasheada.
 *
 * DDD + seguridad: el constructor es privado y la ÚNICA forma de crear la
 * instancia es `fromHash()`. No existe ningún factory que acepte texto plano,
 * de modo que el dominio nunca puede contener una contraseña sin hashear (el
 * hasheo es responsabilidad del `HashService` en infraestructura).
 *
 * `toString()` devuelve `[REDACTED]` para no filtrar el hash en logs (AOP).
 */
export class HashedPassword {
  private constructor(public readonly value: string) {}

  static fromHash(hash: string): HashedPassword {
    if (!hash || hash.trim().length === 0) {
      throw new Error('No se puede crear HashedPassword desde un hash vacío.');
    }
    return new HashedPassword(hash);
  }

  toString(): string {
    return '[REDACTED]';
  }

  equals(other: HashedPassword): boolean {
    return this.value === other.value;
  }
}
