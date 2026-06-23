import { InvalidLevelIdException } from '../exceptions/invalid-level-id.exception';

export class LevelId {
  constructor(readonly value: string) {
    if (!value || value.trim() === '') {
      throw new InvalidLevelIdException('LevelId cannot be empty');
    }
  }

  equals(other: LevelId): boolean {
    return this.value === other.value;
  }
}
