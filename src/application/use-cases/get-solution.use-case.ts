import type { ILevelRepository } from '../ports/i-level.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import type { ArrowId } from '../../domain/value-objects/arrow-id.vo';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { LevelSolver } from '../../domain/services/level-solver';
import { LevelNotFoundException } from '../../domain/exceptions/level-not-found.exception';
import {
  UnsolvableLevelException,
  UnsolvableLevelContext,
} from '../../domain/exceptions/unsolvable-level.exception';

// Caso de uso (back#19): certifica un Level arrow-path con LevelSolver (ADR
// 0002) y devuelve su Solución — el orden de ArrowId que vacía el tablero.
// Framework-free; depende solo de puertos y del servicio de dominio (DIP).
//   - id inexistente/vacío  -> LevelId lanza InvalidLevelIdException (400)
//   - nivel no encontrado   -> LevelNotFoundException (404)
//   - nivel insoluble       -> UnsolvableLevelException (422)
export class GetSolutionUseCase {
  constructor(
    private readonly levelRepo: ILevelRepository,
    private readonly solver: LevelSolver,
    private readonly logger: ILoggerService,
  ) {}

  async execute(rawId: string): Promise<ArrowId[]> {
    const id = new LevelId(rawId);
    const level = await this.levelRepo.findById(id);
    if (!level) {
      throw new LevelNotFoundException(`Level '${id.value}' not found`);
    }

    const solution = this.solver.solve(level);
    if (solution === null) {
      // Un nivel servido debería ser soluble por invariante (guardrail del
      // seed, ADR 0001 dec. 8): si llega aquí, el mapa está corrupto. Log
      // enriquecido para auditoría — no solo el mensaje, sino los metadatos
      // del nivel que no pudo vaciarse.
      const context: UnsolvableLevelContext = {
        levelId: id.value,
        cols: level.cols,
        rows: level.rows,
        arrowCount: level.arrows.length,
        arrowIds: level.arrows.map((arrow) => arrow.id.value),
      };
      this.logger.error(
        `Unsolvable level '${id.value}' — refusing to serve solution | audit=${JSON.stringify(
          context,
        )}`,
        undefined,
        GetSolutionUseCase.name,
      );
      throw new UnsolvableLevelException(
        `Level '${id.value}' has no solution`,
        context,
      );
    }

    this.logger.log(
      `Solution for '${id.value}' computed (${solution.length} steps)`,
      GetSolutionUseCase.name,
    );
    return solution;
  }
}
