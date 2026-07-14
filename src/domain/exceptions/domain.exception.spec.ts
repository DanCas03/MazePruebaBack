import { DomainException } from './domain.exception';
import { LevelNotFoundException } from './level-not-found.exception';
import { UserAlreadyExistsException } from './user-already-exists.exception';
import { InvalidCredentialsException } from './invalid-credentials.exception';

class SomeCustomRuleException extends DomainException {}

class ExplicitCodeException extends DomainException {
  constructor(message: string) {
    super(message, 'MY_EXPLICIT_CODE');
  }
}

describe('DomainException', () => {
  it('derives a stable SCREAMING_SNAKE code from the subclass name', () => {
    // Arrange & Act
    const exception = new SomeCustomRuleException('broken rule');

    // Assert
    expect(exception.code).toBe('SOME_CUSTOM_RULE');
  });

  it('strips the Exception suffix when deriving the code', () => {
    // Arrange & Act
    const notFound = new LevelNotFoundException("Level 'x' not found");
    const duplicate = new UserAlreadyExistsException('taken');
    const badCredentials = new InvalidCredentialsException('bad');

    // Assert
    expect(notFound.code).toBe('LEVEL_NOT_FOUND');
    expect(duplicate.code).toBe('USER_ALREADY_EXISTS');
    expect(badCredentials.code).toBe('INVALID_CREDENTIALS');
  });

  it('honors an explicit code passed by the subclass', () => {
    // Arrange & Act
    const exception = new ExplicitCodeException('custom');

    // Assert
    expect(exception.code).toBe('MY_EXPLICIT_CODE');
  });

  it('keeps name, message and prototype chain intact', () => {
    // Arrange & Act
    const exception = new SomeCustomRuleException('broken rule');

    // Assert
    expect(exception.name).toBe('SomeCustomRuleException');
    expect(exception.message).toBe('broken rule');
    expect(exception).toBeInstanceOf(SomeCustomRuleException);
    expect(exception).toBeInstanceOf(DomainException);
    expect(exception).toBeInstanceOf(Error);
  });
});
