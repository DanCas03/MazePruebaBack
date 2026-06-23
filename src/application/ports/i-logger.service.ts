export interface ILoggerService {
  log(message: string, context?: string): void;
  error(message: string, error?: Error, context?: string): void;
  warn(message: string, context?: string): void;
}

export const LOGGER_SERVICE_TOKEN = 'ILoggerService';
