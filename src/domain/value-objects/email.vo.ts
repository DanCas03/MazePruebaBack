import { InvalidEmailException } from '../exceptions/invalid-email.exception';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  constructor(readonly value: string) {
    if (!EMAIL_REGEX.test(value)) {
      throw new InvalidEmailException(`'${value}' is not a valid email address`);
    }
  }

  equals(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
