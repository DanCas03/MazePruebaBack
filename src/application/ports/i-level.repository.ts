import type { LevelId } from '../../domain/value-objects/level-id.vo';
import type { ICell } from '../../domain/entities/cell.entity';

export interface ILevelRepository {
  findById(id: LevelId): Promise<ICell[][] | null>;
}

export const LEVEL_REPOSITORY_TOKEN = 'ILevelRepository';
