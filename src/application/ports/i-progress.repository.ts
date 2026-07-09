import type { ProgressEntry } from '../../domain/entities/progress-entry.entity';
import type { UserId } from '../../domain/value-objects/user-id.vo';
import type { LevelId } from '../../domain/value-objects/level-id.vo';

// Puerto (DIP): contrato de persistencia del progreso. La capa de aplicación
// depende de esta abstracción; infrastructure la implementa con Prisma.
export interface IProgressRepository {
  findAllByUser(userId: UserId): Promise<ProgressEntry[]>;
  findOne(userId: UserId, levelId: LevelId): Promise<ProgressEntry | null>;
  // Crea o reemplaza el registro (userId, levelId). El merge (nunca degradar
  // progreso) es responsabilidad del caso de uso, no del repositorio.
  upsert(entry: ProgressEntry): Promise<void>;
}

export const PROGRESS_REPOSITORY_TOKEN = 'IProgressRepository';
