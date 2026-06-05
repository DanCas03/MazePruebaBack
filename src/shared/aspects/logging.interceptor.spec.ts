import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';
import { ILoggerService } from '../../application/ports/i-logger.service';

describe('LoggingInterceptor (AOP)', () => {
  let logger: jest.Mocked<ILoggerService>;
  let interceptor: LoggingInterceptor;
  let context: ExecutionContext;

  beforeEach(() => {
    // Arrange (común)
    logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
    interceptor = new LoggingInterceptor(logger);
    context = {
      getClass: () => ({ name: 'LevelController' }),
      getHandler: () => ({ name: 'getById' }),
    } as unknown as ExecutionContext;
  });

  it('registra entrada y salida (2 logs) y deja pasar el resultado', async () => {
    // Arrange
    const next: CallHandler = { handle: () => of('resultado') };

    // Act
    const result = await lastValueFrom(interceptor.intercept(context, next));

    // Assert
    expect(result).toBe('resultado');
    expect(logger.log).toHaveBeenCalledTimes(2);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('registra el error cuando el handler falla y propaga la excepción', async () => {
    // Arrange
    const boom = new Error('fallo');
    const next: CallHandler = { handle: () => throwError(() => boom) };

    // Act / Assert
    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toThrow('fallo');
    expect(logger.log).toHaveBeenCalledTimes(1); // sólo [IN]
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
