import { DomainException } from './domain.exception';

export class InvalidEmailException extends DomainException {
  constructor(raw: string) {
    super(`Formato de email inválido: "${raw}".`);
  }
}
