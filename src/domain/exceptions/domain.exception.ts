/**
 * Excepción base de la capa de Dominio.
 *
 * DDD: las violaciones de invariantes se expresan con errores semánticos
 * propios del dominio, no con errores genéricos. Ninguna excepción de dominio
 * importa nada de NestJS: la capa más interna no conoce el framework. La
 * traducción a códigos HTTP se hace en un filtro de la capa de adaptadores (AOP).
 */
export abstract class DomainException extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
