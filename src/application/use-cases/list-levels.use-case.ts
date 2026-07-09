import type { ILevelRepository } from '../ports/i-level.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import type { Level } from '../../domain/entities/level.entity';

// Caso de uso: lista los niveles disponibles en orden de juego (back#5).
// Framework-free; depende solo de puertos (DIP).
export class ListLevelsUseCase {
  constructor(
    private readonly levelRepo: ILevelRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(): Promise<Level[]> {
    const levels = await this.levelRepo.findAllOrdered();
    this.logger.log(`Listed ${levels.length} level(s)`, ListLevelsUseCase.name);
    return levels;
  }
}
