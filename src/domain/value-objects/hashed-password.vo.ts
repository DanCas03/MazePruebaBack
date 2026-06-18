import { InvalidHashedPasswordException } from '../exceptions/invalid-hashed-password.exception';

export class HashedPassword {
  constructor(readonly value: string) {
    if (!value || value.trim() === '') {
      throw new InvalidHashedPasswordException('HashedPassword cannot be empty');
    }
  }

  equals(other: HashedPassword): boolean {
    return this.value === other.value;
  }
}
