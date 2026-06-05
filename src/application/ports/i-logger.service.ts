/**
 * Puerto de logging (AOP + DIP).
 *
 * La aplicación depende de esta interfaz, nunca de Winston/Pino/NestJS Logger
 * directamente. El aspecto de logging (interceptor) se inyecta a través de este
 * contrato, de modo que cambiar de librería no afecta a la lógica de negocio.
 */
export interface ILoggerService {
  log(message: string, context?: string): void;
  warn(message: string, context?: string): void;
  error(message: string, trace?: string, context?: string): void;
}

/**
 * Token de inyección. En NestJS las interfaces no existen en runtime, así que
 * se registra el provider bajo este símbolo y se inyecta con `@Inject(...)`.
 */
export const LOGGER_SERVICE = Symbol('ILoggerService');
