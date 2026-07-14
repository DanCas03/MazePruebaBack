import { DomainExceptionFilter } from './domain-exception.filter';
import { HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { LevelNotFoundException } from '../../domain/exceptions/level-not-found.exception';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { UserAlreadyExistsException } from '../../domain/exceptions/user-already-exists.exception';
import { UsernameAlreadyTakenException } from '../../domain/exceptions/username-already-taken.exception';
import { UnsolvableLevelException } from '../../domain/exceptions/unsolvable-level.exception';
import { DomainException } from '../../domain/exceptions/domain.exception';

class UnmappedDomainException extends DomainException {}

describe('DomainExceptionFilter', () => {
  let sut: DomainExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockHost = {
      switchToHttp: () => ({ getResponse: () => ({ status: mockStatus }) }),
    } as unknown as ArgumentsHost;
    sut = new DomainExceptionFilter();
  });

  it('maps LevelNotFoundException to HTTP 404 with the uniform error body', () => {
    // Arrange
    const exception = new LevelNotFoundException("Level 'x' not found");

    // Act
    sut.catch(exception, mockHost);

    // Assert
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      code: 'LEVEL_NOT_FOUND',
      message: "Level 'x' not found",
    });
  });

  it('maps InvalidCredentialsException to HTTP 401 Unauthorized', () => {
    // Arrange
    const exception = new InvalidCredentialsException(
      'Invalid email or password',
    );

    // Act
    sut.catch(exception, mockHost);

    // Assert
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNAUTHORIZED,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
  });

  it('maps UserAlreadyExistsException to HTTP 409 Conflict', () => {
    // Arrange
    const exception = new UserAlreadyExistsException(
      'Email already registered',
    );

    // Act
    sut.catch(exception, mockHost);

    // Assert
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      code: 'USER_ALREADY_EXISTS',
      message: 'Email already registered',
    });
  });

  it('maps UsernameAlreadyTakenException to HTTP 409 Conflict', () => {
    // Arrange — un username duplicado es un conflicto equivalente al del email,
    // así que debe salir 409 y no caer al default 400.
    const exception = new UsernameAlreadyTakenException(
      "Username 'player_01' already taken",
    );

    // Act
    sut.catch(exception, mockHost);

    // Assert
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      code: 'USERNAME_ALREADY_TAKEN',
      message: "Username 'player_01' already taken",
    });
  });

  it('maps UnsolvableLevelException to HTTP 422 Unprocessable Entity', () => {
    // Arrange
    const exception = new UnsolvableLevelException(
      "Level 'level-99' has no solution",
    );

    // Act
    sut.catch(exception, mockHost);

    // Assert
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      code: 'UNSOLVABLE_LEVEL',
      message: "Level 'level-99' has no solution",
    });
  });

  it('never leaks the audit context to the client body', () => {
    // Arrange — la excepción lleva metadatos de auditoría; el cuerpo servido
    // debe seguir siendo exactamente { statusCode, code, message }.
    const exception = new UnsolvableLevelException(
      "Level 'level-99' has no solution",
      {
        levelId: 'level-99',
        cols: 4,
        rows: 1,
        arrowCount: 2,
        arrowIds: ['a', 'b'],
      },
    );

    // Act
    sut.catch(exception, mockHost);

    // Assert
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      code: 'UNSOLVABLE_LEVEL',
      message: "Level 'level-99' has no solution",
    });
  });

  it('defaults unmapped domain exceptions to HTTP 400 (never 500)', () => {
    // Arrange
    const exception = new UnmappedDomainException('bad input');

    // Act
    sut.catch(exception, mockHost);

    // Assert
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      code: 'UNMAPPED_DOMAIN',
      message: 'bad input',
    });
  });
});
