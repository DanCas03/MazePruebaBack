import { DomainExceptionFilter } from './domain-exception.filter';
import { HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { LevelNotFoundException } from '../../domain/exceptions/level-not-found.exception';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
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

  it('maps LevelNotFoundException to HTTP 404 with the exception details', () => {
    // Arrange
    const exception = new LevelNotFoundException("Level 'x' not found");

    // Act
    sut.catch(exception, mockHost);

    // Assert
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      error: 'LevelNotFoundException',
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
      error: 'InvalidCredentialsException',
      message: 'Invalid email or password',
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
      error: 'UnmappedDomainException',
      message: 'bad input',
    });
  });
});
