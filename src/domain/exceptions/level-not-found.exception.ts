import { DomainException } from './domain.exception';

export class LevelNotFoundException extends DomainException {
  constructor(levelId: number) {
    super(`No se encontró el nivel ${levelId}.`);
  }
}
