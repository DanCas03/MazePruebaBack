import { DomainException } from './domain.exception';

// Metadatos del mapa que no pudo vaciarse, adjuntados a la excepción para que
// la capa que la lanza (GetSolutionUseCase) los vuelque al log de auditoría.
// No se sirven al cliente: el contrato de error público sigue siendo
// { statusCode, code, message } — el contexto es solo diagnóstico server-side.
export interface UnsolvableLevelContext {
  levelId: string;
  cols: number;
  rows: number;
  arrowCount: number;
  arrowIds: string[];
}

// Un Level persistido resultó insoluble al certificarlo con LevelSolver (ADR
// 0002). Es un 422 Unprocessable Entity: la petición es sintácticamente válida
// y el nivel existe, pero su contenido no admite Solución. `code` se deriva a
// UNSOLVABLE_LEVEL desde el nombre de la clase (ver DomainException).
export class UnsolvableLevelException extends DomainException {
  constructor(
    message: string,
    readonly context?: UnsolvableLevelContext,
  ) {
    super(message);
  }
}
