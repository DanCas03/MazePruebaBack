// `code` es el identificador estable y legible por máquina del tipo de error
// (p.ej. LEVEL_NOT_FOUND) que expone el contrato HTTP público. Se deriva del
// nombre de la subclase para que ninguna necesite boilerplate; una subclase
// puede fijarlo explícitamente si su código debe desacoplarse del nombre.
export class DomainException extends Error {
  readonly code: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code ?? DomainException.codeFromName(this.name);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  private static codeFromName(name: string): string {
    return name
      .replace(/Exception$/, '')
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toUpperCase();
  }
}
