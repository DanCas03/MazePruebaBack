import { DomainException } from './domain.exception';

export class InvalidUuidException extends DomainException {
  constructor(raw: string) {
    super(`Identificador UUID inválido: "${raw}".`);
  }
}
