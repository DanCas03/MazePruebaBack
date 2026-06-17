import { LoggingInterceptor } from './logging.interceptor';
import type { ILoggerService } from '../../application/ports/i-logger.service';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('LoggingInterceptor', () => {
  let sut: LoggingInterceptor;
  let mockLogger: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    sut = new LoggingInterceptor(mockLogger);
  });

  it('should log request start and response completion', (done) => {
    // Arrange
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/levels/1' }),
      }),
    } as unknown as ExecutionContext;
    const mockHandler: CallHandler = { handle: () => of('response') };
    // Act
    sut.intercept(mockContext, mockHandler).subscribe({
      complete: () => {
        // Assert
        expect(mockLogger.log).toHaveBeenCalledTimes(2);
        expect(mockLogger.log).toHaveBeenNthCalledWith(
          1,
          expect.stringContaining('→ GET /levels/1'),
          expect.any(String),
        );
        done();
      },
    });
  });
});
