import type { Level } from '../../domain/entities/level.entity';
import type { LevelId } from '../../domain/value-objects/level-id.vo';

// Puerto (DIP): contrato de persistencia de niveles. La capa de aplicación
// depende de esta abstracción; infrastructure la implementa con Prisma.
export interface ILevelRepository {
  findById(id: LevelId): Promise<Level | null>;
  // Todos los niveles, en orden de juego (back#10 los curará y ordenará).
  findAllOrdered(): Promise<Level[]>;
}

export const LEVEL_REPOSITORY_TOKEN = 'ILevelRepository';
