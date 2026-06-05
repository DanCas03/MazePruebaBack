import { DomainException } from './domain.exception';

export class UnknownCellTypeException extends DomainException {
  constructor(raw: string) {
    super(`Tipo de celda desconocido: "${raw}".`);
  }
}
