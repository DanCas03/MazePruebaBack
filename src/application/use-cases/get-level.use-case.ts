import type { ILevelRepository } from '../ports/i-level.repository';
import type { ILoggerService } from '../ports/i-logger.service';
import type { ICell } from '../../domain/entities/cell.entity';
import { LevelId } from '../../domain/value-objects/level-id.vo';
import { LevelNotFoundException } from '../../domain/exceptions/level-not-found.exception';

export class GetLevelUseCase {
  constructor(
    private readonly levelRepo: ILevelRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(id: LevelId): Promise<ICell[][]> {
    const grid = await this.levelRepo.findById(id);
    if (!grid) {
      throw new LevelNotFoundException(`Level '${id.value}' not found`);
    }
    this.logger.log(`Level '${id.value}' retrieved`, GetLevelUseCase.name);
    return grid;
  }
}
