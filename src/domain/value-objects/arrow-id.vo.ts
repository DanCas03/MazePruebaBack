import { InvalidArrowIdException } from '../exceptions/invalid-arrow-id.exception';

export class ArrowId {
  constructor(readonly value: string) {
    if (!value || value.trim() === '') {
      throw new InvalidArrowIdException('ArrowId cannot be empty');
    }
  }

  equals(other: ArrowId): boolean {
    return this.value === other.value;
  }
}
