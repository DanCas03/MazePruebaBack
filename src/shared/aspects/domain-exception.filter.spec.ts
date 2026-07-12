import { DomainExceptionFilter } from './domain-exception.filter';
import { HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { LevelNotFoundException } from '../../domain/exceptions/level-not-found.exception';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { UserAlreadyExistsException } from '../../domain/exceptions/user-already-exists.exception';
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
    const exception = new InvalidCredentialsException('Invalid email or password');

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
    const exception = new UserAlreadyExistsException('Email already registered');

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
