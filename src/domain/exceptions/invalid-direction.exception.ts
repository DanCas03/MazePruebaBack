import { DomainException } from './domain.exception';

export class InvalidDirectionException extends DomainException {
  constructor(raw: string) {
    super(`Dirección inválida: "${raw}".`);
  }
}
