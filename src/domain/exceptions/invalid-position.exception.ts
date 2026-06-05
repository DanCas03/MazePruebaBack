import { DomainException } from './domain.exception';

export class InvalidPositionException extends DomainException {
  constructor(x: number, y: number) {
    super(`Posición inválida: (${x}, ${y}). Debe ser de enteros no negativos.`);
  }
}
