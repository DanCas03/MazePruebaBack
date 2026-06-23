import { InvalidUserIdException } from '../exceptions/invalid-user-id.exception';

export class UserId {
  constructor(readonly value: string) {
    if (!value || value.trim() === '') {
      throw new InvalidUserIdException('UserId cannot be empty');
    }
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
