import { Logger } from '@nestjs/common';
import { NestLoggerAdapter } from './nest-logger.adapter';

describe('NestLoggerAdapter', () => {
  let adapter: NestLoggerAdapter;

  beforeEach(() => {
    // Arrange (shared): spy on the prototype so the internal Logger instance is observed.
    adapter = new NestLoggerAdapter();
  });

  afterEach(() => {
    // Isolation: restore the Logger.prototype spies so the mutations do not leak
    // into later suites that rely on the real NestJS Logger behavior.
    jest.restoreAllMocks();
  });

  it('delegates log() to the underlying NestJS Logger with the message and context', () => {
    // Arrange
    const spy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    // Act
    adapter.log('hello', 'CtxA');

    // Assert
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('hello', 'CtxA');
  });

  it('delegates error() to the underlying Logger forwarding the error stack and context', () => {
    // Arrange
    const spy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const error = new Error('boom');

    // Act
    adapter.error('failed', error, 'CtxB');

    // Assert
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('failed', error.stack, 'CtxB');
  });

  it('delegates error() with undefined stack when no error is provided', () => {
    // Arrange
    const spy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    // Act
    adapter.error('failed');

    // Assert
    expect(spy).toHaveBeenCalledWith('failed', undefined, undefined);
  });

  it('delegates warn() to the underlying Logger with the message and context', () => {
    // Arrange
    const spy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    // Act
    adapter.warn('careful', 'CtxC');

    // Assert
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('careful', 'CtxC');
  });
});
