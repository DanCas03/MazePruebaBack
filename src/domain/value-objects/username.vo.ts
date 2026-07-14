import { InvalidUsernameException } from '../exceptions/invalid-username.exception';

// VO: identidad mostrable del jugador. Invariante de formato validada en el
// constructor (calca el estilo de Email VO). Igualdad por valor.
const USERNAME_REGEX = /^[A-Za-z0-9_]{3,20}$/;

export class Username {
  constructor(readonly value: string) {
    if (!USERNAME_REGEX.test(value)) {
      throw new InvalidUsernameException(
        `'${value}' is not a valid username (3-20 chars, letters/digits/underscore)`,
      );
    }
  }

  equals(other: Username): boolean {
    return this.value === other.value;
  }
}
