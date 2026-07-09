import type { ILevelRepository } from '../ports/i-level.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import type { Level } from '../../domain/entities/level.entity';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { LevelNotFoundException } from '../../domain/exceptions/level-not-found.exception';

// Caso de uso: obtiene un nivel arrow-path por id (back#5, CONTEXT-MAP.md
// wire contract). Framework-free; depende solo de puertos (DIP).
export class GetLevelUseCase {
  constructor(
    private readonly levelRepo: ILevelRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(rawId: string): Promise<Level> {
    const id = new LevelId(rawId);
    const level = await this.levelRepo.findById(id);
    if (!level) {
      throw new LevelNotFoundException(`Level '${id.value}' not found`);
    }
    this.logger.log(`Level '${id.value}' found`, GetLevelUseCase.name);
    return level;
  }
}
